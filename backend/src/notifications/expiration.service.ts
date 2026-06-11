import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { FridgeItem } from '../households/fridge-item.entity';
import { NotificationsService } from './notifications.service';
import { NotificationLog } from './notification-log.entity';

type ExpirationAlert = {
  item: FridgeItem;
  dedupeKey: string;
  body: string;
};

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(
    @InjectRepository(FridgeItem)
    private fridgeRepo: Repository<FridgeItem>,
    @InjectRepository(NotificationLog)
    private notificationLogsRepo: Repository<NotificationLog>,
    private notificationsService: NotificationsService,
  ) {}

  // Runs every 6 hours. Farther dates dedupe harder; urgent dates alert more often.
  @Cron('10 */6 * * *')
  async checkExpirations(): Promise<void> {
    this.logger.log('Verificando itens proximos do vencimento...');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const in7Days = new Date(today);
    in7Days.setUTCDate(in7Days.getUTCDate() + 7);

    const candidates = await this.fridgeRepo.find({
      where: {
        expirationDate: LessThanOrEqual(in7Days) as any,
        quantity: MoreThanOrEqual(0) as any,
      },
      take: 500,
    });

    const alerts = await this.buildPendingAlerts(candidates, today);
    await this.notifyAlerts(alerts);

    this.logger.log(
      `Cron finalizado. Candidatos: ${candidates.length}, alertas enviados: ${alerts.length}`,
    );
  }

  private async buildPendingAlerts(items: FridgeItem[], today: Date): Promise<ExpirationAlert[]> {
    const period = new Date().getUTCHours() < 12 ? 'am' : 'pm';
    const dateKey = today.toISOString().slice(0, 10);
    const alerts: ExpirationAlert[] = [];

    for (const item of items) {
      if (!item.expirationDate) continue;

      const expiration = new Date(item.expirationDate);
      expiration.setUTCHours(0, 0, 0, 0);
      const days = Math.ceil((expiration.getTime() - today.getTime()) / 86_400_000);
      const alert = this.alertForItem(item, days, dateKey, period);
      if (!alert) continue;

      const alreadySent = await this.notificationLogsRepo.findOne({
        where: { type: 'expiration', dedupeKey: alert.dedupeKey },
      });
      if (!alreadySent) alerts.push(alert);
    }

    return alerts;
  }

  private alertForItem(
    item: FridgeItem,
    days: number,
    dateKey: string,
    period: string,
  ): ExpirationAlert | null {
    if (days > 7) return null;

    if (days >= 4) {
      return {
        item,
        dedupeKey: `${item.id}:week:${days}`,
        body: `${item.name} vence em ${days} dias.`,
      };
    }

    if (days >= 2) {
      return {
        item,
        dedupeKey: `${item.id}:daily:${dateKey}`,
        body: `${item.name} vence em ${days} dias.`,
      };
    }

    if (days === 1) {
      return {
        item,
        dedupeKey: `${item.id}:urgent:${dateKey}:${period}`,
        body: `${item.name} vence amanha.`,
      };
    }

    if (days === 0) {
      return {
        item,
        dedupeKey: `${item.id}:today:${dateKey}:${period}`,
        body: `${item.name} vence hoje.`,
      };
    }

    return {
      item,
      dedupeKey: `${item.id}:expired:${dateKey}`,
      body: `${item.name} ja venceu.`,
    };
  }

  private async notifyAlerts(alerts: ExpirationAlert[]): Promise<void> {
    if (alerts.length === 0) return;

    const byHousehold = new Map<string, ExpirationAlert[]>();
    for (const alert of alerts) {
      const list = byHousehold.get(alert.item.householdId) ?? [];
      list.push(alert);
      byHousehold.set(alert.item.householdId, list);
    }

    for (const [householdId, hAlerts] of byHousehold) {
      const body = hAlerts.map((alert) => alert.body).join('\n');
      this.logger.log(`[${householdId}] Enviando alerta: "${body}"`);

      await this.notificationsService.notifyAllMembers(householdId, 'Geladeira', body);

      await this.notificationLogsRepo.save(
        hAlerts.map((alert) =>
          this.notificationLogsRepo.create({
            type: 'expiration',
            householdId,
            itemId: alert.item.id,
            dedupeKey: alert.dedupeKey,
          }),
        ),
      );
    }
  }
}

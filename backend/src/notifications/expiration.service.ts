import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FridgeItem } from '../households/fridge-item.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(
    @InjectRepository(FridgeItem)
    private fridgeRepo: Repository<FridgeItem>,
    private notificationsService: NotificationsService,
  ) {}

  // 9h BRT = 12h UTC
  @Cron('0 12 * * *')
  async checkExpirations(): Promise<void> {
    this.logger.log('Verificando itens próximos do vencimento...');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const in1Day = new Date(today);
    in1Day.setUTCDate(in1Day.getUTCDate() + 1);

    const in3Days = new Date(today);
    in3Days.setUTCDate(in3Days.getUTCDate() + 3);

    const expiringToday = await this.fridgeRepo.find({
      where: { expirationDate: Between(today, in1Day) as any },
    });

    const expiringSoon = await this.fridgeRepo.find({
      where: { expirationDate: Between(in1Day, in3Days) as any },
    });

    await this.notifyGroup(expiringToday, (names) =>
      `Vencem hoje: ${names}`,
    );

    await this.notifyGroup(expiringSoon, (names) =>
      `Vencem em breve: ${names}`,
    );

    this.logger.log(
      `Cron finalizado. Hoje: ${expiringToday.length}, Em breve: ${expiringSoon.length}`,
    );
  }

  private async notifyGroup(
    items: FridgeItem[],
    buildBody: (names: string) => string,
  ): Promise<void> {
    if (items.length === 0) return;

    const byHousehold = new Map<string, FridgeItem[]>();
    for (const item of items) {
      const list = byHousehold.get(item.householdId) ?? [];
      list.push(item);
      byHousehold.set(item.householdId, list);
    }

    for (const [householdId, hItems] of byHousehold) {
      const names = hItems.map((i) => i.name).join(', ');
      const body = buildBody(names);
      this.logger.log(`[${householdId}] Enviando alerta: "${body}"`);

      await this.notificationsService.notifyAllMembers(householdId, 'Geladeira', body);
    }
  }
}

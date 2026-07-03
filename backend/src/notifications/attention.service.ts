import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Household } from '../households/household.entity';
import { FridgeItem } from '../households/fridge-item.entity';
import { ShoppingItem } from '../households/shopping-item.entity';
import { ShoppingList } from '../households/shopping-list.entity';
import { NotificationLog } from './notification-log.entity';
import { NotificationsService } from './notifications.service';

type AttentionSummary = {
  expiringCount: number;
  urgentListCount: number;
  boughtWaitingCount: number;
  body: string;
};

@Injectable()
export class AttentionService {
  private readonly logger = new Logger(AttentionService.name);

  constructor(
    @InjectRepository(Household)
    private householdsRepo: Repository<Household>,
    @InjectRepository(FridgeItem)
    private fridgeRepo: Repository<FridgeItem>,
    @InjectRepository(ShoppingItem)
    private shoppingItemsRepo: Repository<ShoppingItem>,
    @InjectRepository(ShoppingList)
    private shoppingListsRepo: Repository<ShoppingList>,
    @InjectRepository(NotificationLog)
    private notificationLogsRepo: Repository<NotificationLog>,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('20 9 * * *', { timeZone: 'America/Sao_Paulo' })
  async sendDailyAttentionDigest(): Promise<void> {
    this.logger.log('Verificando resumo diário de atenção da casa...');

    const households = await this.householdsRepo.find({ take: 500 });
    const dateKey = new Date().toISOString().slice(0, 10);
    let sent = 0;

    for (const household of households) {
      const summary = await this.buildSummary(household.id);
      if (!summary) continue;

      const dedupeKey = `${household.id}:${dateKey}`;
      const alreadySent = await this.notificationLogsRepo.findOne({
        where: { type: 'house_attention', dedupeKey },
      });
      if (alreadySent) continue;

      await this.notificationsService.notifyAllMembers(
        household.id,
        'Atencao da casa',
        summary.body,
        {
          data: {
            type: 'house_attention',
            householdId: household.id,
            expiringCount: summary.expiringCount,
            urgentListCount: summary.urgentListCount,
            boughtWaitingCount: summary.boughtWaitingCount,
          },
        },
      );

      await this.notificationLogsRepo.save(
        this.notificationLogsRepo.create({
          type: 'house_attention',
          householdId: household.id,
          itemId: null,
          dedupeKey,
        }),
      );
      sent += 1;
    }

    this.logger.log(`Resumo diario finalizado. Casas notificadas: ${sent}`);
  }

  private async buildSummary(householdId: string): Promise<AttentionSummary | null> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setUTCDate(in3Days.getUTCDate() + 3);

    const [expiringCount, urgentListCount, boughtWaitingCount] = await Promise.all([
      this.fridgeRepo.count({
        where: {
          householdId,
          expirationDate: LessThanOrEqual(in3Days),
        },
      }),
      this.shoppingListsRepo.count({
        where: {
          householdId,
          urgent: true,
        },
      }),
      this.shoppingItemsRepo.count({
        where: {
          householdId,
          checked: true,
        },
      }),
    ]);

    const parts: string[] = [];
    if (expiringCount > 0) {
      parts.push(`${expiringCount} ${expiringCount === 1 ? 'item vencendo' : 'itens vencendo'}`);
    }
    if (urgentListCount > 0) {
      parts.push(`${urgentListCount} ${urgentListCount === 1 ? 'lista urgente' : 'listas urgentes'}`);
    }
    if (boughtWaitingCount > 0) {
      parts.push(
        `${boughtWaitingCount} ${boughtWaitingCount === 1 ? 'comprado esperando guardar' : 'comprados esperando guardar'}`,
      );
    }

    if (parts.length === 0) return null;

    return {
      expiringCount,
      urgentListCount,
      boughtWaitingCount,
      body: `Sua casa tem ${this.joinParts(parts)}.`,
    };
  }

  private joinParts(parts: string[]): string {
    if (parts.length <= 1) return parts[0] ?? '';
    if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
  }
}

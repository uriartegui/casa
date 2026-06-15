import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { ExpirationService } from './expiration.service';
import { AttentionService } from './attention.service';
import { HouseholdMember } from '../households/household-member.entity';
import { Household } from '../households/household.entity';
import { PushToken } from '../users/push-token.entity';
import { FridgeItem } from '../households/fridge-item.entity';
import { ShoppingItem } from '../households/shopping-item.entity';
import { ShoppingList } from '../households/shopping-list.entity';
import { NotificationLog } from './notification-log.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Household,
      HouseholdMember,
      PushToken,
      FridgeItem,
      ShoppingItem,
      ShoppingList,
      NotificationLog,
    ]),
  ],
  providers: [NotificationsService, ExpirationService, AttentionService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

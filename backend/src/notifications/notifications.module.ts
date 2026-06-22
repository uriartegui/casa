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
import { HouseTask } from '../households/house-task.entity';
import { HouseTaskActivity } from '../households/house-task-activity.entity';
import { TaskReminderService } from './task-reminder.service';

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
      HouseTask,
      HouseTaskActivity,
    ]),
  ],
  providers: [NotificationsService, ExpirationService, AttentionService, TaskReminderService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

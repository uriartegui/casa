import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { ExpirationService } from './expiration.service';
import { HouseholdMember } from '../households/household-member.entity';
import { PushToken } from '../users/push-token.entity';
import { FridgeItem } from '../households/fridge-item.entity';
import { NotificationLog } from './notification-log.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([HouseholdMember, PushToken, FridgeItem, NotificationLog]),
  ],
  providers: [NotificationsService, ExpirationService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

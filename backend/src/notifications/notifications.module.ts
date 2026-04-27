import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { ExpirationService } from './expiration.service';
import { HouseholdMember } from '../households/household-member.entity';
import { User } from '../users/user.entity';
import { FridgeItem } from '../households/fridge-item.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([HouseholdMember, User, FridgeItem]),
  ],
  providers: [NotificationsService, ExpirationService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

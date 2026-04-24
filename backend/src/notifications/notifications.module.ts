import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { HouseholdMember } from '../households/household-member.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdMember, User])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

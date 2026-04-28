import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdsService } from './households.service';
import { HouseholdsController } from './households.controller';
import { Household } from './household.entity';
import { HouseholdMember } from './household-member.entity';
import { FridgeItem } from './fridge-item.entity';
import { ShoppingItem } from './shopping-item.entity';
import { ShoppingList } from './shopping-list.entity';
import { Storage } from './storage.entity';
import { HouseholdCategory } from './household-category.entity';
import { HouseholdInvite } from './household-invite.entity';
import { FridgeActivity } from './fridge-activity.entity';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Household, HouseholdMember, FridgeItem, ShoppingItem, ShoppingList, Storage, HouseholdCategory, HouseholdInvite, FridgeActivity]), EventsModule, NotificationsModule],
  providers: [HouseholdsService],
  controllers: [HouseholdsController],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}

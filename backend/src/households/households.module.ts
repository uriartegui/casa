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
import { HouseholdInvite } from './household-invite.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Household, HouseholdMember, FridgeItem, ShoppingItem, ShoppingList, Storage, HouseholdInvite]), EventsModule],
  providers: [HouseholdsService],
  controllers: [HouseholdsController],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}

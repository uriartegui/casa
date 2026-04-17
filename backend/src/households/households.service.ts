import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from './household.entity';
import { HouseholdMember } from './household-member.entity';
import { FridgeItem } from './fridge-item.entity';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdsRepo: Repository<Household>,
    @InjectRepository(HouseholdMember)
    private membersRepo: Repository<HouseholdMember>,
    @InjectRepository(FridgeItem)
    private fridgeRepo: Repository<FridgeItem>,
  ) {}

  async create(name: string, ownerId: string): Promise<Household> {
    const household = this.householdsRepo.create({ name, ownerId });
    const saved = await this.householdsRepo.save(household);

    await this.membersRepo.save({
      userId: ownerId,
      householdId: saved.id,
      role: 'admin',
    });

    return saved;
  }

  async findUserHouseholds(userId: string): Promise<Household[]> {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: ['household'],
    });
    return memberships.map((m) => m.household);
  }

  async getInviteCode(householdId: string, userId: string): Promise<string> {
    await this.assertMember(householdId, userId);
    return Buffer.from(`${householdId}:${Date.now()}`).toString('base64');
  }

  async joinByCode(code: string, userId: string): Promise<Household> {
    const decoded = Buffer.from(code, 'base64').toString('utf-8');
    const householdId = decoded.split(':')[0];

    const household = await this.householdsRepo.findOne({
      where: { id: householdId },
    });
    if (!household) throw new NotFoundException('Convite inválido');

    const exists = await this.membersRepo.findOne({
      where: { userId, householdId },
    });
    if (!exists) {
      await this.membersRepo.save({ userId, householdId, role: 'member' });
    }

    return household;
  }

  async getFridgeItems(
    householdId: string,
    userId: string,
  ): Promise<FridgeItem[]> {
    await this.assertMember(householdId, userId);
    return this.fridgeRepo.find({ where: { householdId } });
  }

  async addFridgeItem(
    householdId: string,
    userId: string,
    data: Partial<FridgeItem>,
  ): Promise<FridgeItem> {
    await this.assertMember(householdId, userId);
    const item = this.fridgeRepo.create({
      ...data,
      householdId,
      createdById: userId,
    });
    return this.fridgeRepo.save(item);
  }

  async removeFridgeItem(
    householdId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.fridgeRepo.delete({ id: itemId, householdId });
  }

  private async assertMember(
    householdId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.membersRepo.findOne({
      where: { householdId, userId },
    });
    if (!member) throw new ForbiddenException('Sem acesso a esta casa');
  }
}

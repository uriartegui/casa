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
import { ShoppingItem } from './shopping-item.entity';
import { AddShoppingItemDto } from './dto/add-shopping-item.dto';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdsRepo: Repository<Household>,
    @InjectRepository(HouseholdMember)
    private membersRepo: Repository<HouseholdMember>,
    @InjectRepository(FridgeItem)
    private fridgeRepo: Repository<FridgeItem>,
    @InjectRepository(ShoppingItem)
    private shoppingRepo: Repository<ShoppingItem>,
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

  async getShoppingList(householdId: string, userId: string): Promise<ShoppingItem[]> {
    await this.assertMember(householdId, userId);
    return this.shoppingRepo.find({
      where: { householdId },
      relations: ['createdBy'],
      order: { checked: 'ASC', createdAt: 'ASC' },
    });
  }

  async addShoppingItem(
    householdId: string,
    userId: string,
    dto: AddShoppingItemDto,
  ): Promise<ShoppingItem> {
    await this.assertMember(householdId, userId);
    const item = this.shoppingRepo.create({
      householdId,
      createdById: userId,
      name: dto.name,
      quantity: dto.quantity ?? 1,
      unit: dto.unit,
    });
    return this.shoppingRepo.save(item);
  }

  async toggleShoppingItem(
    householdId: string,
    itemId: string,
    userId: string,
    checked: boolean,
  ): Promise<ShoppingItem> {
    await this.assertMember(householdId, userId);
    const item = await this.shoppingRepo.findOne({ where: { id: itemId, householdId } });
    if (!item) throw new NotFoundException('Item não encontrado');
    item.checked = checked;
    return this.shoppingRepo.save(item);
  }

  async removeShoppingItem(
    householdId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.delete({ id: itemId, householdId });
  }

  async clearCheckedItems(householdId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.delete({ householdId, checked: true });
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

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { EventsGateway } from '../events/events.gateway';
import { Household } from './household.entity';
import { HouseholdMember } from './household-member.entity';
import { HouseholdInvite } from './household-invite.entity';
import { FridgeItem } from './fridge-item.entity';
import { ShoppingItem } from './shopping-item.entity';
import { Storage } from './storage.entity';
import { AddShoppingItemDto } from './dto/add-shopping-item.dto';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto';

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
    @InjectRepository(Storage)
    private storageRepo: Repository<Storage>,
    @InjectRepository(HouseholdInvite)
    private inviteRepo: Repository<HouseholdInvite>,
    private eventsGateway: EventsGateway,
  ) {}

  async create(name: string, ownerId: string): Promise<Household> {
    const household = this.householdsRepo.create({ name, ownerId });
    const saved = await this.householdsRepo.save(household);

    await this.membersRepo.save({
      userId: ownerId,
      householdId: saved.id,
      role: 'admin',
    });

    await this.storageRepo.save([
      { householdId: saved.id, name: 'Geladeira', emoji: '🧊' },
      { householdId: saved.id, name: 'Freezer', emoji: '❄️' },
      { householdId: saved.id, name: 'Despensa', emoji: '🏠' },
    ]);

    return saved;
  }

  async findUserHouseholds(userId: string): Promise<Household[]> {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: ['household'],
    });
    const householdIds = memberships.map((m) => m.householdId);
    if (householdIds.length === 0) return [];
    return this.householdsRepo.find({
      where: householdIds.map((id) => ({ id })),
      relations: ['members', 'members.user'],
    });
  }

  async getInviteCode(householdId: string, userId: string): Promise<string> {
    await this.assertMember(householdId, userId);

    let code: string;
    let collision: HouseholdInvite | null;
    do {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      collision = await this.inviteRepo.findOne({
        where: { code, expiresAt: MoreThan(new Date()) },
      });
    } while (collision);

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await this.inviteRepo.save({ householdId, code, expiresAt });

    return code;
  }

  async joinByCode(code: string, userId: string): Promise<Household> {
    const invite = await this.inviteRepo.findOne({
      where: { code, expiresAt: MoreThan(new Date()) },
    });
    if (!invite) throw new NotFoundException('Código inválido ou expirado');

    const household = await this.householdsRepo.findOne({
      where: { id: invite.householdId },
    });
    if (!household) throw new NotFoundException('Casa não encontrada');

    const exists = await this.membersRepo.findOne({
      where: { userId, householdId: invite.householdId },
    });
    if (!exists) {
      await this.membersRepo.save({ userId, householdId: invite.householdId, role: 'member' });
      this.eventsGateway.emitHouseholdUpdate(invite.householdId);
    }

    return household;
  }

  // Storages

  async getStorages(householdId: string, userId: string): Promise<Storage[]> {
    await this.assertMember(householdId, userId);
    return this.storageRepo.find({
      where: { householdId },
      order: { createdAt: 'ASC' },
    });
  }

  async createStorage(
    householdId: string,
    userId: string,
    dto: CreateStorageDto,
  ): Promise<Storage> {
    await this.assertMember(householdId, userId);
    return this.storageRepo.save({
      householdId,
      name: dto.name,
      emoji: dto.emoji ?? '🧊',
    });
  }

  async deleteStorage(
    householdId: string,
    storageId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(householdId, userId);
    const count = await this.fridgeRepo.count({ where: { storageId } });
    if (count > 0) {
      throw new BadRequestException(
        'Remova todos os itens antes de excluir este compartimento',
      );
    }
    await this.storageRepo.delete({ id: storageId, householdId });
  }

  // Fridge

  async getFridgeItems(
    householdId: string,
    userId: string,
    storageId?: string,
  ): Promise<FridgeItem[]> {
    await this.assertMember(householdId, userId);
    return this.fridgeRepo.find({
      where: storageId ? { householdId, storageId } : { householdId },
      relations: ['storage', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
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
    const saved = await this.fridgeRepo.save(item);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async updateFridgeItem(
    householdId: string,
    itemId: string,
    userId: string,
    dto: UpdateFridgeItemDto,
  ): Promise<FridgeItem> {
    await this.assertMember(householdId, userId);
    const item = await this.fridgeRepo.findOne({ where: { id: itemId, householdId } });
    if (!item) throw new NotFoundException('Item não encontrado');
    Object.assign(item, dto);
    const saved = await this.fridgeRepo.save(item);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async removeFridgeItem(
    householdId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.fridgeRepo.delete({ id: itemId, householdId });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  // Shopping list

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
    const saved = await this.shoppingRepo.save(item);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
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
    const saved = await this.shoppingRepo.save(item);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async removeShoppingItem(
    householdId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.delete({ id: itemId, householdId });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async clearCheckedItems(householdId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.delete({ householdId, checked: true });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async leaveHousehold(householdId: string, userId: string): Promise<void> {
    const member = await this.membersRepo.findOne({ where: { householdId, userId } });
    if (!member) throw new ForbiddenException('Você não é membro desta casa');

    if (member.role === 'admin') {
      const adminCount = await this.membersRepo.count({ where: { householdId, role: 'admin' } });
      if (adminCount <= 1) throw new BadRequestException('A casa precisa ter pelo menos um admin');
    }

    await this.membersRepo.delete({ householdId, userId });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async promoteToAdmin(householdId: string, targetMemberId: string, requestingUserId: string): Promise<HouseholdMember> {
    const requester = await this.membersRepo.findOne({ where: { householdId, userId: requestingUserId } });
    if (!requester || requester.role !== 'admin') throw new ForbiddenException('Apenas admins podem promover membros');

    const target = await this.membersRepo.findOne({ where: { id: targetMemberId, householdId }, relations: ['user'] });
    if (!target) throw new NotFoundException('Membro não encontrado');

    target.role = 'admin';
    const saved = await this.membersRepo.save(target);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async deleteHousehold(householdId: string, userId: string): Promise<void> {
    const member = await this.membersRepo.findOne({ where: { householdId, userId } });
    if (!member) throw new ForbiddenException('Sem acesso a esta casa');
    if (member.role !== 'admin') throw new ForbiddenException('Apenas o admin pode excluir a casa');
    await this.fridgeRepo.delete({ householdId });
    await this.shoppingRepo.delete({ householdId });
    await this.storageRepo.delete({ householdId });
    await this.membersRepo.delete({ householdId });
    await this.householdsRepo.delete({ id: householdId });
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

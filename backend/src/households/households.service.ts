import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not, IsNull } from 'typeorm';
import { EventsGateway } from '../events/events.gateway';
import { Household } from './household.entity';
import { HouseholdMember } from './household-member.entity';
import { HouseholdInvite } from './household-invite.entity';
import { FridgeItem } from './fridge-item.entity';
import { ShoppingItem } from './shopping-item.entity';
import { ShoppingList } from './shopping-list.entity';
import { Storage } from './storage.entity';
import { AddShoppingItemDto } from './dto/add-shopping-item.dto';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';

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
    @InjectRepository(ShoppingList)
    private shoppingListsRepo: Repository<ShoppingList>,
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

  // Shopping Lists

  async getShoppingLists(householdId: string, userId: string): Promise<(ShoppingList & { itemCount: number })[]> {
    await this.assertMember(householdId, userId);
    const lists = await this.shoppingListsRepo.find({
      where: { householdId },
      order: { createdAt: 'ASC' },
    });
    const counts = await Promise.all(
      lists.map((l) => this.shoppingRepo.count({ where: { shoppingListId: l.id } })),
    );
    return lists.map((l, i) => Object.assign(l, { itemCount: counts[i] }));
  }

  async createShoppingList(householdId: string, userId: string, dto: CreateShoppingListDto): Promise<ShoppingList> {
    await this.assertMember(householdId, userId);
    const list = this.shoppingListsRepo.create({
      householdId,
      createdById: userId,
      name: dto.name,
      place: dto.place ?? null,
      category: dto.category ?? null,
    });
    const saved = await this.shoppingListsRepo.save(list);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async updateShoppingList(householdId: string, listId: string, userId: string, dto: CreateShoppingListDto): Promise<ShoppingList> {
    await this.assertMember(householdId, userId);
    const list = await this.shoppingListsRepo.findOne({ where: { id: listId, householdId } });
    if (!list) throw new NotFoundException('Lista não encontrada');
    Object.assign(list, { name: dto.name, place: dto.place ?? null, category: dto.category ?? null });
    const saved = await this.shoppingListsRepo.save(list);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async deleteShoppingList(householdId: string, listId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    const list = await this.shoppingListsRepo.findOne({ where: { id: listId, householdId } });
    if (!list) throw new NotFoundException('Lista não encontrada');
    await this.shoppingRepo.delete({ shoppingListId: listId });
    await this.shoppingListsRepo.delete(listId);
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async getListItems(householdId: string, listId: string, userId: string): Promise<ShoppingItem[]> {
    await this.assertMember(householdId, userId);
    return this.shoppingRepo.find({
      where: { shoppingListId: listId, householdId },
      order: { createdAt: 'ASC' },
    });
  }

  async addListItem(householdId: string, listId: string, userId: string, dto: AddListItemDto): Promise<ShoppingItem> {
    await this.assertMember(householdId, userId);
    const list = await this.shoppingListsRepo.findOne({ where: { id: listId, householdId } });
    if (!list) throw new NotFoundException('Lista não encontrada');
    const item = this.shoppingRepo.create({
      householdId,
      shoppingListId: listId,
      createdById: userId,
      name: dto.name,
      quantity: dto.quantity ?? 1,
      unit: dto.unit ?? 'un',
      checked: false,
    });
    const saved = await this.shoppingRepo.save(item) as ShoppingItem;
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async toggleListItem(householdId: string, listId: string, itemId: string, userId: string, checked: boolean): Promise<ShoppingItem> {
    await this.assertMember(householdId, userId);
    const item = await this.shoppingRepo.findOne({ where: { id: itemId, shoppingListId: listId, householdId } });
    if (!item) throw new NotFoundException('Item não encontrado');
    item.checked = checked;
    const saved = await this.shoppingRepo.save(item);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async removeListItem(householdId: string, listId: string, itemId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.delete({ id: itemId, shoppingListId: listId, householdId });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async clearCheckedListItems(householdId: string, listId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.delete({ shoppingListId: listId, householdId, checked: true });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async getShoppingActivity(householdId: string, userId: string) {
    await this.assertMember(householdId, userId);

    const [shoppingItems, fridgeItems] = await Promise.all([
      this.shoppingRepo.find({
        where: { householdId },
        relations: ['createdBy', 'shoppingList'],
        order: { createdAt: 'DESC' },
        take: 40,
      }),
      this.fridgeRepo.find({
        where: { householdId, fromShoppingListName: Not(IsNull()) },
        relations: ['createdBy'],
        order: { createdAt: 'DESC' },
        take: 40,
      }),
    ]);

    return [
      ...shoppingItems.map((i) => ({
        id: `shop_${i.id}`,
        type: 'added' as const,
        name: i.name,
        listName: i.shoppingList?.name ?? 'lista',
        createdBy: i.createdBy,
        createdAt: i.createdAt,
      })),
      ...fridgeItems.map((i) => ({
        id: `fridge_${i.id}`,
        type: 'sent_to_fridge' as const,
        name: i.name,
        listName: i.fromShoppingListName!,
        createdBy: i.createdBy,
        createdAt: i.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
  }

  async getFridgeCategories(householdId: string, userId: string, storageId?: string): Promise<string[]> {
    await this.assertMember(householdId, userId);
    const qb = this.fridgeRepo
      .createQueryBuilder('item')
      .select('DISTINCT item.category', 'category')
      .where('item.householdId = :householdId', { householdId })
      .andWhere('item.category IS NOT NULL');
    if (storageId) {
      qb.andWhere('item.storageId = :storageId', { storageId });
    }
    const result = await qb.getRawMany<{ category: string }>();
    return result.map((r) => r.category);
  }
}

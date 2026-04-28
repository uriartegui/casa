import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThan, Not, IsNull } from 'typeorm';
import { randomBytes } from 'crypto';
import { EventsGateway } from '../events/events.gateway';
import { Household } from './household.entity';
import { HouseholdMember } from './household-member.entity';
import { HouseholdInvite } from './household-invite.entity';
import { FridgeItem } from './fridge-item.entity';
import { FridgeActivity } from './fridge-activity.entity';
import { ShoppingItem } from './shopping-item.entity';
import { ShoppingList } from './shopping-list.entity';
import { Storage } from './storage.entity';
import { HouseholdCategory } from './household-category.entity';
import { CreateStorageDto } from './dto/create-storage.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HouseholdsService {
  private readonly logger = new Logger(HouseholdsService.name);

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
    @InjectRepository(HouseholdCategory)
    private categoryRepo: Repository<HouseholdCategory>,
    @InjectRepository(HouseholdInvite)
    private inviteRepo: Repository<HouseholdInvite>,
    @InjectRepository(FridgeActivity)
    private fridgeActivityRepo: Repository<FridgeActivity>,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async create(name: string, ownerId: string): Promise<Household> {
    const household = this.householdsRepo.create({ name, ownerId });
    const saved = await this.householdsRepo.save(household);

    await this.membersRepo.save({
      userId: ownerId,
      householdId: saved.id,
      role: 'admin',
    });

    const [geladeira, freezer, despensa] = await this.storageRepo.save([
      { householdId: saved.id, name: 'Geladeira', emoji: '🧊' },
      { householdId: saved.id, name: 'Freezer', emoji: '❄️' },
      { householdId: saved.id, name: 'Despensa', emoji: '🏠' },
    ]);

    await this.categoryRepo.save([
      { householdId: saved.id, storageId: geladeira.id, label: 'Laticínios', emoji: '🥛' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Carnes & Ovos', emoji: '🍖' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Frutas', emoji: '🍎' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Verduras/Legumes', emoji: '🥦' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Bebidas', emoji: '🥤' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Molhos & Condimentos', emoji: '🧂' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Prontos/Restos', emoji: '🍽️' },
      { householdId: saved.id, storageId: freezer.id, label: 'Carnes congeladas', emoji: '🥩' },
      { householdId: saved.id, storageId: freezer.id, label: 'Vegetais congelados', emoji: '🥦' },
      { householdId: saved.id, storageId: freezer.id, label: 'Pratos prontos', emoji: '🍕' },
      { householdId: saved.id, storageId: freezer.id, label: 'Sobremesas', emoji: '🍦' },
      { householdId: saved.id, storageId: freezer.id, label: 'Pães congelados', emoji: '🍞' },
      { householdId: saved.id, storageId: despensa.id, label: 'Grãos & Cereais', emoji: '🌾' },
      { householdId: saved.id, storageId: despensa.id, label: 'Enlatados/Conservas', emoji: '🥫' },
      { householdId: saved.id, storageId: despensa.id, label: 'Massas & Farinhas', emoji: '🍝' },
      { householdId: saved.id, storageId: despensa.id, label: 'Snacks & Biscoitos', emoji: '🍪' },
      { householdId: saved.id, storageId: despensa.id, label: 'Temperos', emoji: '🧂' },
      { householdId: saved.id, storageId: despensa.id, label: 'Bebidas', emoji: '🧃' },
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
      code = randomBytes(4).toString('hex').toUpperCase();
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
      await this.inviteRepo.delete({ code });
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

  async updateStorage(
    householdId: string,
    storageId: string,
    userId: string,
    dto: UpdateStorageDto,
  ): Promise<Storage> {
    await this.assertMember(householdId, userId);
    const storage = await this.storageRepo.findOne({ where: { id: storageId, householdId } });
    if (!storage) throw new NotFoundException('Compartimento não encontrado');
    if (dto.name) storage.name = dto.name.trim();
    if (dto.emoji) storage.emoji = dto.emoji;
    return this.storageRepo.save(storage);
  }

  // Categories

  async getCategories(householdId: string, storageId: string, userId: string): Promise<HouseholdCategory[]> {
    await this.assertMember(householdId, userId);
    return this.categoryRepo.find({
      where: { householdId, storageId },
      order: { createdAt: 'ASC' },
    });
  }

  async createCategory(
    householdId: string,
    storageId: string,
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<HouseholdCategory> {
    await this.assertMember(householdId, userId);
    await this.assertMember(householdId, userId);
    const storageExists = await this.storageRepo.findOne({ where: { id: storageId, householdId } });
    if (!storageExists) throw new NotFoundException('Compartimento não encontrado');
    return this.categoryRepo.save({
      householdId,
      storageId,
      label: dto.label.trim(),
      emoji: dto.emoji ?? '📦',
    });
  }

  async deleteCategory(
    householdId: string,
    categoryId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.categoryRepo.delete({ id: categoryId, householdId });
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

    const member = await this.membersRepo.findOne({
      where: { userId, householdId },
      relations: ['user'],
    });
    const userName = member?.user?.name ?? 'Alguém';
    this.notificationsService
      .notifyHouseholdMembers(householdId, userId, '🧊 Item adicionado na geladeira', `${userName} adicionou ${saved.name}`)
      .catch(() => {});

    this.fridgeActivityRepo.save({
      householdId,
      action: 'added',
      itemName: saved.name,
      quantity: saved.quantity,
      unit: saved.unit,
      userId,
      userName,
      fromShoppingListName: (data as any).fromShoppingListName ?? null,
    }).catch((err) => this.logger.error('[FridgeActivity] save error: ' + err?.message));

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
    toShoppingListName?: string,
  ): Promise<void> {
    await this.assertMember(householdId, userId);
    const item = await this.fridgeRepo.findOne({ where: { id: itemId, householdId } });
    if (item) {
      const member = await this.membersRepo.findOne({ where: { userId, householdId }, relations: ['user'] });
      const userName = member?.user?.name ?? 'Alguém';
      this.fridgeActivityRepo.save({
        householdId,
        action: 'removed',
        itemName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        userId,
        userName,
        toShoppingListName: toShoppingListName ?? undefined,
      }).catch((err) => this.logger.error('[FridgeActivity] save error: ' + err?.message));
    }
    await this.fridgeRepo.delete({ id: itemId, householdId });
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

  async removeMember(householdId: string, targetMemberId: string, requestingUserId: string): Promise<void> {
    const requester = await this.membersRepo.findOne({ where: { householdId, userId: requestingUserId } });
    if (!requester || requester.role !== 'admin') throw new ForbiddenException('Apenas admins podem remover membros');

    const target = await this.membersRepo.findOne({ where: { id: targetMemberId, householdId } });
    if (!target) throw new NotFoundException('Membro não encontrado');
    if (target.userId === requestingUserId) throw new BadRequestException('Use a opção "Sair da casa" para se remover');

    await this.membersRepo.delete({ id: targetMemberId });
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(FridgeItem, { householdId });
      await queryRunner.manager.delete(ShoppingItem, { householdId });
      await queryRunner.manager.delete(Storage, { householdId });
      await queryRunner.manager.delete(HouseholdMember, { householdId });
      await queryRunner.manager.delete(Household, { id: householdId });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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
    const lists = await this.shoppingListsRepo.find({ where: { householdId }, order: { createdAt: 'ASC' } });
    if (lists.length === 0) return [];
    const counts = await this.shoppingRepo
      .createQueryBuilder('item')
      .select('item.shoppingListId', 'listId')
      .addSelect('COUNT(*)', 'count')
      .where('item.householdId = :householdId', { householdId })
      .groupBy('item.shoppingListId')
      .getRawMany<{ listId: string; count: string }>();
    const countMap = Object.fromEntries(counts.map((c) => [c.listId, Number(c.count)]));
    return lists.map((l) => Object.assign(l, { itemCount: countMap[l.id] ?? 0 }));
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
    Object.assign(list, { name: dto.name, place: dto.place ?? null, category: dto.category ?? null, ...(dto.urgent !== undefined && { urgent: dto.urgent }) });
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

    const member = await this.membersRepo.findOne({
      where: { userId, householdId },
      relations: ['user'],
    });
    const userName = member?.user?.name ?? 'Alguém';
    this.notificationsService
      .notifyHouseholdMembers(householdId, userId, '🛒 Item adicionado na lista', `${userName} adicionou ${saved.name} em "${list.name}"`)
      .catch(() => {});

    return saved;
  }

  async toggleListItem(householdId: string, listId: string, itemId: string, userId: string, dto: { checked?: boolean }): Promise<ShoppingItem> {
    await this.assertMember(householdId, userId);
    const item = await this.shoppingRepo.findOne({ where: { id: itemId, shoppingListId: listId, householdId } });
    if (!item) throw new NotFoundException('Item não encontrado');
    if (dto.checked !== undefined) item.checked = dto.checked;
    const saved = await this.shoppingRepo.save(item);
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async removeListItem(householdId: string, listId: string, itemId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.softDelete({ id: itemId, shoppingListId: listId, householdId });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async clearCheckedListItems(householdId: string, listId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    await this.shoppingRepo.softDelete({ shoppingListId: listId, householdId, checked: true });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async getShoppingActivity(householdId: string, userId: string) {
    await this.assertMember(householdId, userId);

    const [shoppingItems, fridgeItems] = await Promise.all([
      this.shoppingRepo.find({
        where: { householdId },
        relations: ['createdBy', 'shoppingList'],
        withDeleted: true,
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

  async getFridgeActivity(householdId: string, userId: string) {
    await this.assertMember(householdId, userId);
    return this.fridgeActivityRepo.find({
      where: { householdId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
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

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThan, LessThan } from 'typeorm';
import { randomInt } from 'crypto';
import { EventsGateway } from '../events/events.gateway';
import { Household } from './household.entity';
import { HouseholdMember } from './household-member.entity';
import { HouseholdInvite } from './household-invite.entity';
import { FridgeItem } from './fridge-item.entity';
import { FridgeActivity } from './fridge-activity.entity';
import { ShoppingActivity } from './shopping-activity.entity';
import { HouseTask } from './house-task.entity';
import { HouseTaskActivity } from './house-task-activity.entity';
import { TaskCategory } from './task-category.entity';
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
import { CreateHouseTaskDto } from './dto/create-house-task.dto';
import { NotificationsService } from '../notifications/notifications.service';

const DEFAULT_TASK_CATEGORIES = [
  'Limpeza',
  'Cozinha',
  'Banheiro',
  'Lavanderia',
  'Manutencao',
  'Compras',
  'Organizacao',
  'Outros',
];

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
    @InjectRepository(ShoppingActivity)
    private shoppingActivityRepo: Repository<ShoppingActivity>,
    @InjectRepository(HouseTask)
    private houseTasksRepo: Repository<HouseTask>,
    @InjectRepository(HouseTaskActivity)
    private houseTaskActivityRepo: Repository<HouseTaskActivity>,
    @InjectRepository(TaskCategory)
    private taskCategoriesRepo: Repository<TaskCategory>,
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

    const [geladeira, freezer, despensa, limpeza, banheiro, lavanderia] = await this.storageRepo.save([
      { householdId: saved.id, name: 'Geladeira', emoji: '\u{1F9CA}' },
      { householdId: saved.id, name: 'Freezer', emoji: '\u2744\uFE0F' },
      { householdId: saved.id, name: 'Despensa', emoji: '\u{1F3E0}' },
      { householdId: saved.id, name: 'Limpeza', emoji: '\u{1F9FD}' },
      { householdId: saved.id, name: 'Banheiro', emoji: '\u{1F6C1}' },
      { householdId: saved.id, name: 'Lavanderia', emoji: '\u{1F9FA}' },
    ]);

    await this.categoryRepo.save([
      { householdId: saved.id, storageId: geladeira.id, label: 'Laticinios', emoji: '\u{1F95B}' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Carnes & Ovos', emoji: '\u{1F356}' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Frutas', emoji: '\u{1F34E}' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Verduras/Legumes', emoji: '\u{1F966}' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Bebidas', emoji: '\u{1F964}' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Molhos & Condimentos', emoji: '\u{1F9C2}' },
      { householdId: saved.id, storageId: geladeira.id, label: 'Prontos/Restos', emoji: '\u{1F37D}\uFE0F' },
      { householdId: saved.id, storageId: freezer.id, label: 'Carnes congeladas', emoji: '\u{1F969}' },
      { householdId: saved.id, storageId: freezer.id, label: 'Vegetais congelados', emoji: '\u{1F966}' },
      { householdId: saved.id, storageId: freezer.id, label: 'Pratos prontos', emoji: '\u{1F355}' },
      { householdId: saved.id, storageId: freezer.id, label: 'Sobremesas', emoji: '\u{1F366}' },
      { householdId: saved.id, storageId: freezer.id, label: 'Paes congelados', emoji: '\u{1F35E}' },
      { householdId: saved.id, storageId: despensa.id, label: 'Graos & Cereais', emoji: '\u{1F33E}' },
      { householdId: saved.id, storageId: despensa.id, label: 'Enlatados/Conservas', emoji: '\u{1F96B}' },
      { householdId: saved.id, storageId: despensa.id, label: 'Massas & Farinhas', emoji: '\u{1F35D}' },
      { householdId: saved.id, storageId: despensa.id, label: 'Snacks & Biscoitos', emoji: '\u{1F36A}' },
      { householdId: saved.id, storageId: despensa.id, label: 'Temperos', emoji: '\u{1F9C2}' },
      { householdId: saved.id, storageId: despensa.id, label: 'Bebidas', emoji: '\u{1F9C3}' },
      { householdId: saved.id, storageId: limpeza.id, label: 'Limpeza geral', emoji: '\u{1F9FD}' },
      { householdId: saved.id, storageId: limpeza.id, label: 'Cozinha', emoji: '\u{1F37D}\uFE0F' },
      { householdId: saved.id, storageId: limpeza.id, label: 'Lixo & Sacos', emoji: '\u{1F5D1}\uFE0F' },
      { householdId: saved.id, storageId: banheiro.id, label: 'Higiene pessoal', emoji: '\u{1F9F4}' },
      { householdId: saved.id, storageId: banheiro.id, label: 'Papel & Algodao', emoji: '\u{1F9FB}' },
      { householdId: saved.id, storageId: banheiro.id, label: 'Cabelo', emoji: '\u{1F9F4}' },
      { householdId: saved.id, storageId: lavanderia.id, label: 'Roupas', emoji: '\u{1F9FA}' },
      { householdId: saved.id, storageId: lavanderia.id, label: 'Passadoria', emoji: '\u{1F455}' },
    ]);

    await this.taskCategoriesRepo.save(
      DEFAULT_TASK_CATEGORIES.map((name, position) => ({ householdId: saved.id, name, position })),
    );

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
    await this.inviteRepo.delete({ expiresAt: LessThan(new Date()) });

    let code: string;
    let collision: HouseholdInvite | null;
    do {
      code = randomInt(10000, 100000).toString();
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
      // O convite nao e deletado aqui: o mesmo codigo pode ser usado por
      // várias pessoas até expirar (a tela promete "válido por 2 horas").
      this.eventsGateway.emitHouseholdUpdate(invite.householdId);
    }

    return household;
  }

  // Storages

  async getStorages(householdId: string, userId: string, includeHidden = false): Promise<Storage[]> {
    await this.assertMember(householdId, userId);
    return this.storageRepo.find({
      where: includeHidden ? { householdId } : { householdId, hidden: false },
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
      emoji: dto.emoji ?? '\u{1F4E6}',
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
    await this.categoryRepo.delete({ storageId, householdId });
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
    if (!storage) throw new NotFoundException('Compartimento nao encontrado');
    if (dto.name) storage.name = dto.name.trim();
    if (dto.emoji) storage.emoji = dto.emoji;
    if (dto.hidden !== undefined) storage.hidden = dto.hidden;
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

  async getFridgeItem(
    householdId: string,
    itemId: string,
    userId: string,
  ): Promise<FridgeItem> {
    await this.assertMember(householdId, userId);
    const item = await this.fridgeRepo.findOne({
      where: { id: itemId, householdId },
      relations: ['storage', 'createdBy'],
    });
    if (!item) throw new NotFoundException('Item não encontrado');
    return item;
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

    const member = await this.membersRepo.findOne({
      where: { userId, householdId },
      relations: ['user'],
    });
    const userName = member?.user?.name ?? 'Alguém';
    const storage = saved.storageId
      ? await this.storageRepo.findOne({ where: { id: saved.storageId, householdId } })
      : null;

    await this.fridgeActivityRepo.save({
      householdId,
      action: 'added',
      itemName: saved.name,
      quantity: saved.quantity,
      unit: saved.unit,
      userId,
      userName,
      storageId: saved.storageId ?? null,
      storageName: storage?.name ?? null,
      storageEmoji: storage?.emoji ?? null,
      fromShoppingListName: (data as any).fromShoppingListName ?? null,
    } as any);

    this.eventsGateway.emitHouseholdUpdate(householdId);

    if ((data as any).fromShoppingListName) {
      const storageName = storage?.name ?? 'estoque';
      this.notificationsService
        .notifyHouseholdMembers(
          householdId,
          userId,
          'Estoque',
          `${userName} guardou ${saved.name} em ${storageName}`,
          {
            data: {
              type: 'shopping_item_sent_to_stock',
              householdId,
              itemId: saved.id,
              itemName: saved.name,
              storageId: saved.storageId,
              storageName,
              listName: (data as any).fromShoppingListName,
            },
          },
        )
        .catch(() => {});
    }

    return saved;
  }

  async updateFridgeItem(
    householdId: string,
    itemId: string,
    userId: string,
    dto: UpdateFridgeItemDto,
  ): Promise<FridgeItem> {
    await this.assertMember(householdId, userId);
    const item = await this.fridgeRepo.findOne({
      where: { id: itemId, householdId },
      relations: ['storage'],
    });
    if (!item) throw new NotFoundException('Item não encontrado');
    const changedFields = this.getFridgeChangedFields(item, dto);

    Object.assign(item, dto);
    const saved = await this.fridgeRepo.save(item);

    if (changedFields.length > 0) {
      const member = await this.membersRepo.findOne({ where: { userId, householdId }, relations: ['user'] });
      const userName = member?.user?.name ?? 'Alguém';
      const storage = saved.storageId
        ? await this.storageRepo.findOne({ where: { id: saved.storageId, householdId } })
        : null;
      await this.fridgeActivityRepo.save({
        householdId,
        action: 'updated',
        itemName: saved.name,
        quantity: saved.quantity,
        unit: saved.unit,
        userId,
        userName,
        storageId: saved.storageId ?? null,
        storageName: storage?.name ?? item.storage?.name ?? null,
        storageEmoji: storage?.emoji ?? item.storage?.emoji ?? null,
        details: changedFields.join(', '),
      } as any);
    }

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
    const item = await this.fridgeRepo.findOne({
      where: { id: itemId, householdId },
      relations: ['storage'],
    });
    if (item) {
      const member = await this.membersRepo.findOne({ where: { userId, householdId }, relations: ['user'] });
      const userName = member?.user?.name ?? 'Alguém';
      await this.fridgeActivityRepo.save({
        householdId,
        action: 'removed',
        itemName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        userId,
        userName,
        storageId: item.storageId ?? null,
        storageName: item.storage?.name ?? null,
        storageEmoji: item.storage?.emoji ?? null,
        toShoppingListName: toShoppingListName ?? undefined,
      } as any);
      if (toShoppingListName) {
        this.notificationsService
          .notifyHouseholdMembers(
            householdId,
            userId,
            'Estoque',
            `${userName} acabou com ${item.name} e mandou para a lista "${toShoppingListName}"`,
            {
              data: {
                type: 'stock_finished_to_list',
                householdId,
                itemId,
                itemName: item.name,
                listName: toShoppingListName,
              },
            },
          )
          .catch(() => {});
      }
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
      await queryRunner.manager.delete(FridgeActivity, { householdId });
      await queryRunner.manager.delete(ShoppingActivity, { householdId });
      await queryRunner.manager.delete(HouseTask, { householdId });
      await queryRunner.manager.delete(ShoppingItem, { householdId });
      await queryRunner.manager.delete(ShoppingList, { householdId });
      await queryRunner.manager.delete(HouseholdCategory, { householdId });
      await queryRunner.manager.delete(Storage, { householdId });
      await queryRunner.manager.delete(HouseholdInvite, { householdId });
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

  private getFridgeChangedFields(item: FridgeItem, dto: UpdateFridgeItemDto): string[] {
    const changed: string[] = [];

    if (dto.name !== undefined && dto.name !== item.name) changed.push('nome');
    if (dto.quantity !== undefined && Number(dto.quantity) !== Number(item.quantity)) changed.push('quantidade');
    if (dto.unit !== undefined && dto.unit !== item.unit) changed.push('unidade');
    if (dto.category !== undefined && (dto.category ?? null) !== (item.category ?? null)) changed.push('categoria');

    if (dto.expirationDate !== undefined) {
      const currentDate = item.expirationDate ? new Date(item.expirationDate).toISOString().slice(0, 10) : null;
      if ((dto.expirationDate ?? null) !== currentDate) changed.push('validade');
    }

    return changed;
  }

  private async getHouseholdUserName(householdId: string, userId: string): Promise<string> {
    const member = await this.membersRepo.findOne({
      where: { userId, householdId },
      relations: ['user'],
    });
    return member?.user?.name ?? 'Alguém';
  }

  private async logShoppingActivity(data: Partial<ShoppingActivity>) {
    await this.shoppingActivityRepo.save(data as ShoppingActivity);
  }

  // House Tasks

  async getTaskCategories(householdId: string, userId: string): Promise<TaskCategory[]> {
    await this.assertMember(householdId, userId);
    return this.taskCategoriesRepo.find({ where: { householdId }, order: { position: 'ASC', createdAt: 'ASC' } });
  }

  async createTaskCategory(householdId: string, userId: string, name: string): Promise<TaskCategory> {
    await this.assertMember(householdId, userId);
    const clean = name.trim();
    if (!clean) throw new BadRequestException('Informe o nome da categoria');
    const position = await this.taskCategoriesRepo.count({ where: { householdId } });
    const saved = await this.taskCategoriesRepo.save(this.taskCategoriesRepo.create({ householdId, name: clean, position }));
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async deleteTaskCategory(householdId: string, categoryId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    const category = await this.taskCategoriesRepo.findOne({ where: { id: categoryId, householdId } });
    if (!category) throw new NotFoundException('Categoria nao encontrada');
    await this.houseTasksRepo.update({ householdId, category: category.name }, { category: null });
    await this.taskCategoriesRepo.delete(categoryId);
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async getHouseTasks(householdId: string, userId: string): Promise<HouseTask[]> {
    await this.assertMember(householdId, userId);
    return this.houseTasksRepo.find({
      where: { householdId },
      relations: ['createdBy', 'completedBy', 'assignedTo', 'shoppingList'],
      order: { done: 'ASC', dueDate: 'ASC', createdAt: 'DESC' },
      take: 100,
    });
  }

  async getHouseTaskActivity(householdId: string, userId: string): Promise<HouseTaskActivity[]> {
    await this.assertMember(householdId, userId);
    return this.houseTaskActivityRepo.find({ where: { householdId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  private async assertTaskAssignee(householdId: string, assignmentType: string, assignedToId?: string | null) {
    if (assignmentType !== 'user') return null;
    if (!assignedToId) throw new BadRequestException('Escolha o responsavel da tarefa');
    const member = await this.membersRepo.findOne({ where: { householdId, userId: assignedToId } });
    if (!member) throw new BadRequestException('Responsavel nao pertence a esta casa');
    return assignedToId;
  }

  private async assertTaskShoppingList(householdId: string, shoppingListId?: string | null) {
    if (!shoppingListId) return null;
    const list = await this.shoppingListsRepo.findOne({ where: { id: shoppingListId, householdId } });
    if (!list) throw new BadRequestException('Lista de compras nao pertence a esta casa');
    return list.id;
  }

  private async logHouseTaskActivity(data: Partial<HouseTaskActivity>) {
    await this.houseTaskActivityRepo.save(this.houseTaskActivityRepo.create(data));
  }

  private recurrenceDays(task: HouseTask): number | null {
    if (task.recurrence === 'daily') return 1;
    if (task.recurrence === 'weekly') return 7;
    if (task.recurrence === 'biweekly') return 14;
    if (task.recurrence === 'monthly') return 30;
    if (task.recurrence === 'custom') return task.recurrenceIntervalDays ?? null;
    return null;
  }

  private nextDueDate(task: HouseTask): string | null {
    const days = this.recurrenceDays(task);
    if (!days || !task.dueDate) return null;
    const date = new Date(`${task.dueDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  async createHouseTask(
    householdId: string,
    userId: string,
    dto: CreateHouseTaskDto,
  ): Promise<HouseTask> {
    await this.assertMember(householdId, userId);
    const assignmentType = dto.assignmentType ?? 'unassigned';
    const assignedToId = await this.assertTaskAssignee(householdId, assignmentType, dto.assignedToId);
    const shoppingListId = await this.assertTaskShoppingList(householdId, dto.shoppingListId);
    const task = this.houseTasksRepo.create({
      householdId,
      createdById: userId,
      title: dto.title.trim(),
      category: dto.category?.trim() || null,
      description: dto.description?.trim() || null,
      dueDate: dto.dueDate || null,
      done: false,
      status: 'pending',
      assignmentType,
      assignedToId,
      shoppingListId,
      recurrence: dto.recurrence ?? 'none',
      recurrenceIntervalDays: dto.recurrence === 'custom' ? dto.recurrenceIntervalDays ?? null : null,
      reminder: dto.reminder ?? 'none',
      completedById: null,
      completedAt: null,
    });
    const saved = await this.houseTasksRepo.save(task);
    const userName = await this.getHouseholdUserName(householdId, userId);
    await this.logHouseTaskActivity({ householdId, taskId: saved.id, action: 'created', taskTitle: saved.title, userId, userName, details: saved.dueDate ? `Prazo: ${saved.dueDate}` : null });
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return this.houseTasksRepo.findOneOrFail({
      where: { id: saved.id, householdId },
      relations: ['createdBy', 'completedBy', 'assignedTo', 'shoppingList'],
    });
  }

  async updateHouseTask(
    householdId: string,
    taskId: string,
    userId: string,
    dto: CreateHouseTaskDto & { done?: boolean; status?: 'pending' | 'in_progress' | 'completed' | 'skipped' },
  ): Promise<HouseTask> {
    await this.assertMember(householdId, userId);
    const task = await this.houseTasksRepo.findOne({ where: { id: taskId, householdId } });
    if (!task) throw new NotFoundException('Tarefa nao encontrada');

    const oldStatus = task.status;
    const nextStatus = dto.status ?? (dto.done === undefined ? task.status : (dto.done ? 'completed' : 'pending'));
    if (dto.title !== undefined) task.title = dto.title.trim();
    if (dto.description !== undefined) task.description = dto.description?.trim() || null;
    if (dto.category !== undefined) task.category = dto.category?.trim() || null;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate || null;
    if (dto.assignmentType !== undefined) {
      task.assignmentType = dto.assignmentType;
      task.assignedToId = await this.assertTaskAssignee(householdId, dto.assignmentType, dto.assignedToId);
    } else if (dto.assignedToId !== undefined && task.assignmentType === 'user') {
      task.assignedToId = await this.assertTaskAssignee(householdId, 'user', dto.assignedToId);
    }
    if (dto.recurrence !== undefined) task.recurrence = dto.recurrence;
    if (dto.recurrenceIntervalDays !== undefined) task.recurrenceIntervalDays = dto.recurrenceIntervalDays;
    if (dto.reminder !== undefined) task.reminder = dto.reminder;
    if (dto.shoppingListId !== undefined) task.shoppingListId = await this.assertTaskShoppingList(householdId, dto.shoppingListId);
    task.status = nextStatus;
    task.done = nextStatus === 'completed';
    task.completedById = task.done ? userId : null;
    task.completedAt = task.done ? new Date() : null;
    await this.houseTasksRepo.save(task);

    const userName = await this.getHouseholdUserName(householdId, userId);
    const action = nextStatus === 'completed'
      ? (oldStatus === 'completed' ? 'updated' : 'completed')
      : nextStatus === 'skipped'
        ? 'skipped'
        : oldStatus === 'completed' ? 'reopened' : 'updated';
    await this.logHouseTaskActivity({ householdId, taskId: task.id, action, taskTitle: task.title, userId, userName, details: null });

    if (oldStatus !== 'completed' && nextStatus === 'completed') {
      const nextDueDate = this.nextDueDate(task);
      if (nextDueDate) {
        const next = this.houseTasksRepo.create({
          householdId, createdById: task.createdById, title: task.title, description: task.description,
          category: task.category, dueDate: nextDueDate, done: false, status: 'pending',
          assignmentType: task.assignmentType, assignedToId: task.assignedToId,
          shoppingListId: task.shoppingListId,
          recurrence: task.recurrence, recurrenceIntervalDays: task.recurrenceIntervalDays,
          reminder: task.reminder, completedById: null, completedAt: null,
        });
        const nextSaved = await this.houseTasksRepo.save(next);
        await this.logHouseTaskActivity({ householdId, taskId: nextSaved.id, action: 'next_created', taskTitle: nextSaved.title, userId, userName, details: `Proxima ocorrencia: ${nextDueDate}` });
      }
    }
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return this.houseTasksRepo.findOneOrFail({
      where: { id: task.id, householdId },
      relations: ['createdBy', 'completedBy', 'assignedTo', 'shoppingList'],
    });
  }

  async deleteHouseTask(householdId: string, taskId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    const task = await this.houseTasksRepo.findOne({ where: { id: taskId, householdId } });
    if (!task) throw new NotFoundException('Tarefa nao encontrada');
    const userName = await this.getHouseholdUserName(householdId, userId);
    await this.houseTasksRepo.delete({ id: taskId, householdId });
    await this.logHouseTaskActivity({ householdId, taskId: task.id, action: 'deleted', taskTitle: task.title, userId, userName, details: null });
    this.eventsGateway.emitHouseholdUpdate(householdId);
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
      .andWhere('item.deletedAt IS NULL')
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
      urgent: dto.urgent ?? false,
    });
    const saved = await this.shoppingListsRepo.save(list);
    const userName = await this.getHouseholdUserName(householdId, userId);
    await this.logShoppingActivity({
      householdId,
      shoppingListId: saved.id,
      action: 'list_created',
      itemName: saved.name,
      listName: saved.name,
      userId,
      userName,
    });
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
    const userName = await this.getHouseholdUserName(householdId, userId);
    await this.shoppingRepo.delete({ shoppingListId: listId });
    await this.shoppingListsRepo.delete(listId);
    await this.logShoppingActivity({
      householdId,
      shoppingListId: list.id,
      action: 'list_deleted',
      itemName: list.name,
      listName: list.name,
      userId,
      userName,
    });
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
      category: dto.category ?? null,
      checked: false,
    });
    const saved = await this.shoppingRepo.save(item) as ShoppingItem;

    const userName = await this.getHouseholdUserName(householdId, userId);
    await this.logShoppingActivity({
      householdId,
      shoppingListId: list.id,
      action: 'added',
      itemName: saved.name,
      listName: list.name,
      quantity: saved.quantity,
      unit: saved.unit,
      userId,
      userName,
    });
    this.eventsGateway.emitHouseholdUpdate(householdId);
    if (dto.notify !== false) {
      this.notificationsService
        .notifyHouseholdMembers(householdId, userId, 'Lista de compras', `${userName} adicionou ${saved.name} na lista "${list.name}"`)
        .catch(() => {});
    }

    return saved;
  }

  async toggleListItem(householdId: string, listId: string, itemId: string, userId: string, dto: { checked?: boolean }): Promise<ShoppingItem> {
    await this.assertMember(householdId, userId);
    const item = await this.shoppingRepo.findOne({
      where: { id: itemId, shoppingListId: listId, householdId },
      relations: ['shoppingList'],
    });
    if (!item) throw new NotFoundException('Item não encontrado');
    const previousChecked = item.checked;
    if (dto.checked !== undefined) item.checked = dto.checked;
    const saved = await this.shoppingRepo.save(item);
    if (dto.checked !== undefined && dto.checked !== previousChecked) {
      const userName = await this.getHouseholdUserName(householdId, userId);
      await this.logShoppingActivity({
        householdId,
        shoppingListId: listId,
        action: dto.checked ? 'checked' : 'unchecked',
        itemName: saved.name,
        listName: item.shoppingList?.name ?? 'lista',
        quantity: saved.quantity,
        unit: saved.unit,
        userId,
        userName,
      });
    }
    this.eventsGateway.emitHouseholdUpdate(householdId);
    return saved;
  }

  async removeListItem(householdId: string, listId: string, itemId: string, userId: string, reason: 'removed' | 'sent_to_fridge' = 'removed'): Promise<void> {
    await this.assertMember(householdId, userId);
    const item = await this.shoppingRepo.findOne({
      where: { id: itemId, shoppingListId: listId, householdId },
      relations: ['shoppingList'],
    });
    if (item) {
      const userName = await this.getHouseholdUserName(householdId, userId);
      await this.logShoppingActivity({
        householdId,
        shoppingListId: listId,
        action: reason,
        itemName: item.name,
        listName: item.shoppingList?.name ?? 'lista',
        quantity: item.quantity,
        unit: item.unit,
        userId,
        userName,
      });
    }
    await this.shoppingRepo.softDelete({ id: itemId, shoppingListId: listId, householdId });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async clearCheckedListItems(householdId: string, listId: string, userId: string): Promise<void> {
    await this.assertMember(householdId, userId);
    const items = await this.shoppingRepo.find({
      where: { shoppingListId: listId, householdId, checked: true },
      relations: ['shoppingList'],
    });
    if (items.length > 0) {
      const userName = await this.getHouseholdUserName(householdId, userId);
      await Promise.all(items.map((item) => (
        this.logShoppingActivity({
          householdId,
          shoppingListId: listId,
          action: 'removed',
          itemName: item.name,
          listName: item.shoppingList?.name ?? 'lista',
          quantity: item.quantity,
          unit: item.unit,
          userId,
          userName,
        })
      )));
    }
    await this.shoppingRepo.softDelete({ shoppingListId: listId, householdId, checked: true });
    this.eventsGateway.emitHouseholdUpdate(householdId);
  }

  async getShoppingActivity(householdId: string, userId: string) {
    await this.assertMember(householdId, userId);
    return this.shoppingActivityRepo.find({
      where: { householdId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getReplenishmentSuggestions(householdId: string, userId: string) {
    await this.assertMember(householdId, userId);

    const activeListItems = await this.shoppingRepo.find({
      where: { householdId },
    });
    const stockItems = await this.fridgeRepo.find({
      where: { householdId },
    });
    const historicalListItems = await this.shoppingRepo
      .createQueryBuilder('item')
      .withDeleted()
      .where('item.householdId = :householdId', { householdId })
      .orderBy('item.createdAt', 'DESC')
      .take(250)
      .getMany();

    const blockedNames = new Set(
      [...activeListItems.map((item) => item.name), ...stockItems.map((item) => item.name)]
        .map((name) => this.normalizeSuggestionName(name)),
    );
    const stats = new Map<string, {
      name: string;
      count: number;
      lastBoughtAt: Date;
      quantity: number | null;
      unit: string | null;
    }>();

    for (const item of historicalListItems) {
      const key = this.normalizeSuggestionName(item.name);
      if (!key || blockedNames.has(key)) continue;

      const current = stats.get(key);
      const createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
      if (!current) {
        stats.set(key, {
          name: item.name,
          count: 1,
          lastBoughtAt: createdAt,
          quantity: item.quantity === null || item.quantity === undefined ? null : Number(item.quantity),
          unit: item.unit ?? null,
        });
        continue;
      }

      current.count += 1;
      if (createdAt.getTime() > current.lastBoughtAt.getTime()) {
        current.name = item.name;
        current.lastBoughtAt = createdAt;
        current.quantity = item.quantity === null || item.quantity === undefined ? current.quantity : Number(item.quantity);
        current.unit = item.unit ?? current.unit;
      }
    }

    return [...stats.values()]
      .filter((item) => item.count >= 2)
      .sort((a, b) => b.count - a.count || b.lastBoughtAt.getTime() - a.lastBoughtAt.getTime())
      .slice(0, 6)
      .map((item) => ({
        name: item.name,
        count: item.count,
        lastBoughtAt: item.lastBoughtAt,
        quantity: item.quantity ?? 1,
        unit: item.unit ?? 'un',
      }));
  }

  async getHouseholdAttention(householdId: string, userId: string) {
    await this.assertMember(householdId, userId);

    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    const [urgentLists, boughtItems, expiringItems, suggestions] = await Promise.all([
      this.shoppingListsRepo.find({ where: { householdId, urgent: true }, order: { createdAt: 'DESC' }, take: 3 }),
      this.shoppingRepo.find({ where: { householdId, checked: true }, order: { createdAt: 'DESC' }, take: 5 }),
      this.fridgeRepo
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.storage', 'storage')
        .where('item.householdId = :householdId', { householdId })
        .andWhere('item.expirationDate IS NOT NULL')
        .andWhere('item.expirationDate <= :in3Days', { in3Days: in3Days.toISOString().slice(0, 10) })
        .orderBy('item.expirationDate', 'ASC')
        .take(5)
        .getMany(),
      this.getReplenishmentSuggestions(householdId, userId),
    ]);

    const items: Array<{
      type: 'expiration' | 'urgent_list' | 'bought_waiting' | 'replenishment';
      severity: 'danger' | 'warning' | 'info';
      title: string;
      subtitle: string;
      targetId?: string;
    }> = [];

    expiringItems.slice(0, 3).forEach((item) => {
      const days = Math.ceil((new Date(item.expirationDate).getTime() - now.getTime()) / 86_400_000);
      const title = days < 0
        ? `${item.name} ja venceu`
        : days === 0
          ? `${item.name} vence hoje`
          : `${item.name} vence em ${days} dias`;
      items.push({
        type: 'expiration',
        severity: days <= 0 ? 'danger' : 'warning',
        title,
        subtitle: item.storage ? `${item.storage.emoji} ${item.storage.name}` : 'Estoque',
        targetId: item.id,
      });
    });

    urgentLists.forEach((list) => {
      items.push({
        type: 'urgent_list',
        severity: 'warning',
        title: `${list.name} esta urgente`,
        subtitle: 'Lista de compras',
        targetId: list.id,
      });
    });

    if (boughtItems.length > 0) {
      items.push({
        type: 'bought_waiting',
        severity: 'info',
        title: `${boughtItems.length} ${boughtItems.length === 1 ? 'comprado esperando guardar' : 'comprados esperando guardar'}`,
        subtitle: boughtItems.slice(0, 2).map((item) => item.name).join(', '),
      });
    }

    suggestions.slice(0, 2).forEach((suggestion) => {
      items.push({
        type: 'replenishment',
        severity: 'info',
        title: `Comprar ${suggestion.name} de novo?`,
        subtitle: `Apareceu em listas ${suggestion.count} vezes`,
      });
    });

    return { items: items.slice(0, 6) };
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

  private normalizeSuggestionName(name: string | null | undefined): string {
    return (name ?? '')
      .trim()
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}

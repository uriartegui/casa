import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { HouseholdsService } from './households.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { AddFridgeItemDto } from './dto/add-fridge-item.dto';

import { ToggleShoppingItemDto } from './dto/toggle-shopping-item.dto';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
import { CreateHouseTaskDto } from './dto/create-house-task.dto';
import { CreateTaskCategoryDto } from './dto/create-task-category.dto';

@ApiTags('households')
@ApiBearerAuth()
@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private householdsService: HouseholdsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma casa' })
  create(@Body() dto: CreateHouseholdDto, @Request() req) {
    return this.householdsService.create(dto.name, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar minhas casas' })
  findMine(@Request() req) {
    return this.householdsService.findUserHouseholds(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir casa (admin only)' })
  deleteHousehold(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.deleteHousehold(id, req.user.id);
  }

  @Delete(':id/members/me')
  @ApiOperation({ summary: 'Sair da casa' })
  leaveHousehold(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.leaveHousehold(id, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remover membro da casa (admin only)' })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Request() req,
  ) {
    return this.householdsService.removeMember(id, memberId, req.user.id);
  }

  @Patch(':id/members/:memberId/promote')
  @ApiOperation({ summary: 'Tornar membro admin (admin only)' })
  promoteToAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Request() req,
  ) {
    return this.householdsService.promoteToAdmin(id, memberId, req.user.id);
  }

  @Get(':id/invite')
  @ApiOperation({ summary: 'Gerar código de convite' })
  async getInvite(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const inviteCode = await this.householdsService.getInviteCode(id, req.user.id);
    return { inviteCode };
  }

  @Post('join/:code')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Entrar em uma casa por convite' })
  join(@Param('code') code: string, @Request() req) {
    return this.householdsService.joinByCode(code, req.user.id);
  }

  // Storages

  @Get(':id/storages')
  @ApiOperation({ summary: 'Listar compartimentos da casa' })
  getStorages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeHidden') includeHidden: string | undefined,
    @Request() req,
  ) {
    return this.householdsService.getStorages(id, req.user.id, includeHidden === 'true');
  }

  @Post(':id/storages')
  @ApiOperation({ summary: 'Criar compartimento (freezer, isopor, etc.)' })
  createStorage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStorageDto,
    @Request() req,
  ) {
    return this.householdsService.createStorage(id, req.user.id, dto);
  }

  @Patch(':id/storages/:storageId')
  @ApiOperation({ summary: 'Renomear compartimento' })
  updateStorage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('storageId', ParseUUIDPipe) storageId: string,
    @Body() dto: UpdateStorageDto,
    @Request() req,
  ) {
    return this.householdsService.updateStorage(id, storageId, req.user.id, dto);
  }

  @Delete(':id/storages/:storageId')
  @ApiOperation({ summary: 'Excluir compartimento' })
  deleteStorage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('storageId', ParseUUIDPipe) storageId: string,
    @Request() req,
  ) {
    return this.householdsService.deleteStorage(id, storageId, req.user.id);
  }

  // Categories

  @Get(':id/storages/:storageId/categories')
  @ApiOperation({ summary: 'Listar categorias do compartimento' })
  getCategories(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('storageId', ParseUUIDPipe) storageId: string,
    @Request() req,
  ) {
    return this.householdsService.getCategories(id, storageId, req.user.id);
  }

  @Post(':id/storages/:storageId/categories')
  @ApiOperation({ summary: 'Criar categoria no compartimento' })
  createCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('storageId', ParseUUIDPipe) storageId: string,
    @Body() dto: CreateCategoryDto,
    @Request() req,
  ) {
    return this.householdsService.createCategory(id, storageId, req.user.id, dto);
  }

  @Delete(':id/categories/:categoryId')
  @ApiOperation({ summary: 'Excluir categoria' })
  deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Request() req,
  ) {
    return this.householdsService.deleteCategory(id, categoryId, req.user.id);
  }

  // Fridge

  @Get(':id/fridge/categories')
  @ApiOperation({ summary: 'Categorias de itens do estoque' })
  getFridgeCategories(@Param('id', ParseUUIDPipe) id: string, @Query('storageId') storageId: string | undefined, @Request() req) {
    return this.householdsService.getFridgeCategories(id, req.user.id, storageId);
  }

  @Get(':id/fridge')
  @ApiOperation({ summary: 'Ver itens do estoque' })
  getFridge(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('storageId') storageId: string | undefined,
    @Request() req,
  ) {
    return this.householdsService.getFridgeItems(id, req.user.id, storageId);
  }

  @Get(':id/fridge/:itemId')
  @ApiOperation({ summary: 'Ver item do estoque' })
  getFridgeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req,
  ) {
    return this.householdsService.getFridgeItem(id, itemId, req.user.id);
  }

  @Post(':id/fridge')
  @ApiOperation({ summary: 'Adicionar item no estoque' })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddFridgeItemDto,
    @Request() req,
  ) {
    return this.householdsService.addFridgeItem(id, req.user.id, dto);
  }

  @Patch(':id/fridge/:itemId')
  @ApiOperation({ summary: 'Editar item do estoque' })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateFridgeItemDto,
    @Request() req,
  ) {
    return this.householdsService.updateFridgeItem(id, itemId, req.user.id, dto);
  }

  @Delete(':id/fridge/:itemId')
  @ApiOperation({ summary: 'Remover item do estoque' })
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query('toList') toList: string | undefined,
    @Request() req,
  ) {
    return this.householdsService.removeFridgeItem(id, itemId, req.user.id, toList);
  }

  @Get(':id/fridge-activity')
  @ApiOperation({ summary: 'Historico de atividade do estoque' })
  getFridgeActivity(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.getFridgeActivity(id, req.user.id);
  }

  // Shopping Lists

  @Get(':id/shopping-activity')
  @ApiOperation({ summary: 'Atividade de compras da casa' })
  getShoppingActivity(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.getShoppingActivity(id, req.user.id);
  }

  @Get(':id/replenishment-suggestions')
  @ApiOperation({ summary: 'Sugestoes de reposicao da casa' })
  getReplenishmentSuggestions(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.getReplenishmentSuggestions(id, req.user.id);
  }

  @Get(':id/attention')
  @ApiOperation({ summary: 'Resumo de atencao da casa' })
  getHouseholdAttention(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.getHouseholdAttention(id, req.user.id);
  }

  // House Tasks

  @Get(':id/task-categories')
  getTaskCategories(@Param('id', ParseUUIDPipe) id: string, @Request() req) { return this.householdsService.getTaskCategories(id, req.user.id); }

  @Post(':id/task-categories')
  createTaskCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateTaskCategoryDto, @Request() req) { return this.householdsService.createTaskCategory(id, req.user.id, dto.name); }

  @Delete(':id/task-categories/:categoryId')
  deleteTaskCategory(@Param('id', ParseUUIDPipe) id: string, @Param('categoryId', ParseUUIDPipe) categoryId: string, @Request() req) { return this.householdsService.deleteTaskCategory(id, categoryId, req.user.id); }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Listar tarefas da casa' })
  getHouseTasks(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.getHouseTasks(id, req.user.id);
  }

  @Get(':id/task-activity')
  @ApiOperation({ summary: 'Historico das tarefas da casa' })
  getHouseTaskActivity(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.getHouseTaskActivity(id, req.user.id);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Criar tarefa da casa' })
  createHouseTask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateHouseTaskDto, @Request() req) {
    return this.householdsService.createHouseTask(id, req.user.id, dto);
  }

  @Patch(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Editar, concluir, reabrir ou pular tarefa da casa' })
  updateHouseTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateHouseTaskDto & { done?: boolean; status?: 'pending' | 'in_progress' | 'completed' | 'skipped' },
    @Request() req,
  ) {
    return this.householdsService.updateHouseTask(id, taskId, req.user.id, dto);
  }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Excluir tarefa da casa' })
  deleteHouseTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Request() req,
  ) {
    return this.householdsService.deleteHouseTask(id, taskId, req.user.id);
  }

  @Get(':id/shopping-lists')
  @ApiOperation({ summary: 'Listar listas de compras' })
  getShoppingLists(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.householdsService.getShoppingLists(id, req.user.id);
  }

  @Post(':id/shopping-lists')
  @ApiOperation({ summary: 'Criar lista de compras' })
  createShoppingList(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateShoppingListDto, @Request() req) {
    return this.householdsService.createShoppingList(id, req.user.id, dto);
  }

  @Patch(':id/shopping-lists/:listId')
  @ApiOperation({ summary: 'Editar lista de compras' })
  updateShoppingList(@Param('id', ParseUUIDPipe) id: string, @Param('listId', ParseUUIDPipe) listId: string, @Body() dto: CreateShoppingListDto, @Request() req) {
    return this.householdsService.updateShoppingList(id, listId, req.user.id, dto);
  }

  @Delete(':id/shopping-lists/:listId')
  @ApiOperation({ summary: 'Excluir lista de compras' })
  deleteShoppingList(@Param('id', ParseUUIDPipe) id: string, @Param('listId', ParseUUIDPipe) listId: string, @Request() req) {
    return this.householdsService.deleteShoppingList(id, listId, req.user.id);
  }

  // Shopping List Items

  @Get(':id/shopping-lists/:listId/items')
  @ApiOperation({ summary: 'Listar itens da lista' })
  getListItems(@Param('id', ParseUUIDPipe) id: string, @Param('listId', ParseUUIDPipe) listId: string, @Request() req) {
    return this.householdsService.getListItems(id, listId, req.user.id);
  }

  @Post(':id/shopping-lists/:listId/items')
  @ApiOperation({ summary: 'Adicionar item à lista' })
  addListItem(@Param('id', ParseUUIDPipe) id: string, @Param('listId', ParseUUIDPipe) listId: string, @Body() dto: AddListItemDto, @Request() req) {
    return this.householdsService.addListItem(id, listId, req.user.id, dto);
  }

  @Patch(':id/shopping-lists/:listId/items/:itemId')
  @ApiOperation({ summary: 'Marcar/desmarcar item' })
  toggleListItem(@Param('id', ParseUUIDPipe) id: string, @Param('listId', ParseUUIDPipe) listId: string, @Param('itemId', ParseUUIDPipe) itemId: string, @Body() dto: ToggleShoppingItemDto, @Request() req) {
    return this.householdsService.toggleListItem(id, listId, itemId, req.user.id, dto);
  }

  @Delete(':id/shopping-lists/:listId/items/checked')
  @ApiOperation({ summary: 'Limpar itens comprados da lista' })
  clearCheckedListItems(@Param('id', ParseUUIDPipe) id: string, @Param('listId', ParseUUIDPipe) listId: string, @Request() req) {
    return this.householdsService.clearCheckedListItems(id, listId, req.user.id);
  }

  @Delete(':id/shopping-lists/:listId/items/:itemId')
  @ApiOperation({ summary: 'Remover item da lista' })
  removeListItem(@Param('id', ParseUUIDPipe) id: string, @Param('listId', ParseUUIDPipe) listId: string, @Param('itemId', ParseUUIDPipe) itemId: string, @Request() req, @Query('reason') reason?: string) {
    return this.householdsService.removeListItem(id, listId, itemId, req.user.id, reason === 'sent_to_fridge' ? 'sent_to_fridge' : 'removed');
  }

}

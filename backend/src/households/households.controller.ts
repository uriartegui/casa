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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HouseholdsService } from './households.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { AddFridgeItemDto } from './dto/add-fridge-item.dto';
import { AddShoppingItemDto } from './dto/add-shopping-item.dto';
import { ToggleShoppingItemDto } from './dto/toggle-shopping-item.dto';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto';

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

  @Get(':id/invite')
  @ApiOperation({ summary: 'Gerar código de convite' })
  async getInvite(@Param('id') id: string, @Request() req) {
    const inviteCode = await this.householdsService.getInviteCode(id, req.user.id);
    return { inviteCode };
  }

  @Post('join/:code')
  @ApiOperation({ summary: 'Entrar em uma casa por convite' })
  join(@Param('code') code: string, @Request() req) {
    return this.householdsService.joinByCode(code, req.user.id);
  }

  // Storages

  @Get(':id/storages')
  @ApiOperation({ summary: 'Listar compartimentos da casa' })
  getStorages(@Param('id') id: string, @Request() req) {
    return this.householdsService.getStorages(id, req.user.id);
  }

  @Post(':id/storages')
  @ApiOperation({ summary: 'Criar compartimento (freezer, isopor, etc.)' })
  createStorage(
    @Param('id') id: string,
    @Body() dto: CreateStorageDto,
    @Request() req,
  ) {
    return this.householdsService.createStorage(id, req.user.id, dto);
  }

  @Delete(':id/storages/:storageId')
  @ApiOperation({ summary: 'Excluir compartimento' })
  deleteStorage(
    @Param('id') id: string,
    @Param('storageId') storageId: string,
    @Request() req,
  ) {
    return this.householdsService.deleteStorage(id, storageId, req.user.id);
  }

  // Fridge

  @Get(':id/fridge')
  @ApiOperation({ summary: 'Ver itens da geladeira' })
  getFridge(
    @Param('id') id: string,
    @Query('storageId') storageId: string | undefined,
    @Request() req,
  ) {
    return this.householdsService.getFridgeItems(id, req.user.id, storageId);
  }

  @Post(':id/fridge')
  @ApiOperation({ summary: 'Adicionar item na geladeira' })
  addItem(
    @Param('id') id: string,
    @Body() dto: AddFridgeItemDto,
    @Request() req,
  ) {
    return this.householdsService.addFridgeItem(id, req.user.id, dto);
  }

  @Patch(':id/fridge/:itemId')
  @ApiOperation({ summary: 'Editar item da geladeira' })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateFridgeItemDto,
    @Request() req,
  ) {
    return this.householdsService.updateFridgeItem(id, itemId, req.user.id, dto);
  }

  @Delete(':id/fridge/:itemId')
  @ApiOperation({ summary: 'Remover item da geladeira' })
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req,
  ) {
    return this.householdsService.removeFridgeItem(id, itemId, req.user.id);
  }

  // Shopping list

  @Get(':id/shopping-list')
  @ApiOperation({ summary: 'Listar itens da lista de compras' })
  getShoppingList(@Param('id') id: string, @Request() req) {
    return this.householdsService.getShoppingList(id, req.user.id);
  }

  @Post(':id/shopping-list')
  @ApiOperation({ summary: 'Adicionar item na lista de compras' })
  addShoppingItem(
    @Param('id') id: string,
    @Body() dto: AddShoppingItemDto,
    @Request() req,
  ) {
    return this.householdsService.addShoppingItem(id, req.user.id, dto);
  }

  @Patch(':id/shopping-list/:itemId')
  @ApiOperation({ summary: 'Marcar/desmarcar item como comprado' })
  toggleShoppingItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ToggleShoppingItemDto,
    @Request() req,
  ) {
    return this.householdsService.toggleShoppingItem(id, itemId, req.user.id, dto.checked);
  }

  @Delete(':id/shopping-list/checked')
  @ApiOperation({ summary: 'Limpar itens comprados' })
  clearChecked(@Param('id') id: string, @Request() req) {
    return this.householdsService.clearCheckedItems(id, req.user.id);
  }

  @Delete(':id/shopping-list/:itemId')
  @ApiOperation({ summary: 'Remover item da lista de compras' })
  removeShoppingItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req,
  ) {
    return this.householdsService.removeShoppingItem(id, itemId, req.user.id);
  }
}

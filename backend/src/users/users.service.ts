import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { HouseholdMember } from '../households/household-member.entity';
import { Household } from '../households/household.entity';
import { HouseholdInvite } from '../households/household-invite.entity';
import { HouseholdCategory } from '../households/household-category.entity';
import { FridgeItem } from '../households/fridge-item.entity';
import { FridgeActivity } from '../households/fridge-activity.entity';
import { ShoppingItem } from '../households/shopping-item.entity';
import { ShoppingList } from '../households/shopping-list.entity';
import { Storage } from '../households/storage.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { SmsOtp } from '../auth/sms-otp.entity';
import { PushToken } from './push-token.entity';
import { RemovePushTokenDto, UpdatePushTokenDto } from './dto/update-push-token.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(PushToken)
    private pushTokensRepo: Repository<PushToken>,
    private dataSource: DataSource,
  ) {}

  async create(name: string, password: string, phone: string): Promise<User> {
    const phoneExists = await this.usersRepo.findOne({ where: { phone } });
    if (phoneExists) throw new ConflictException('Telefone já cadastrado');

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ name, password: hashed, phone });
    return this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      select: { id: true, email: true, name: true, password: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { phone },
      select: { id: true, email: true, name: true, password: true },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.usersRepo.update(userId, { password: hashedPassword });
  }

  async updatePushToken(userId: string, dto: UpdatePushTokenDto): Promise<void> {
    if (dto.deviceId) {
      await this.pushTokensRepo.delete({ deviceId: dto.deviceId });
    }

    await this.pushTokensRepo.upsert(
      {
        userId,
        token: dto.pushToken,
        platform: dto.platform ?? null,
        deviceId: dto.deviceId ?? null,
      },
      ['token'],
    );
  }

  async removePushToken(userId: string, dto: RemovePushTokenDto): Promise<void> {
    if (dto.pushToken) {
      await this.pushTokensRepo.delete({ userId, token: dto.pushToken });
    }
    if (dto.deviceId) {
      await this.pushTokensRepo.delete({ userId, deviceId: dto.deviceId });
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ id: string; name: string; email: string | null }> {
    if (dto.newPassword && !dto.currentPassword) {
      throw new BadRequestException('Informe a senha atual para trocar a senha');
    }
    if (dto.currentPassword && !dto.newPassword) {
      throw new BadRequestException('Informe a nova senha');
    }

    if (dto.currentPassword && dto.newPassword) {
      const user = await this.usersRepo.findOne({
        where: { id: userId },
        select: { id: true, email: true, name: true, password: true },
      });
      if (!user) throw new NotFoundException('Usuário não encontrado');
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) throw new BadRequestException('Senha atual incorreta');
    }

    const updates: Partial<User> = {};
    if (dto.name) updates.name = dto.name.trim();
    if (dto.newPassword) updates.password = await bcrypt.hash(dto.newPassword, 10);

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Nenhuma alteração enviada');
    }

    await this.usersRepo.update(userId, updates);
    const updated = await this.usersRepo.findOne({ where: { id: userId } });
    return { id: updated!.id, name: updated!.name, email: updated!.email };
  }

  /**
   * Exclusão de conta (exigência da App Store 5.1.1(v)).
   * Casas onde o usuário é o único membro são apagadas por inteiro; nas
   * compartilhadas ele sai (promovendo o membro mais antigo se era o único
   * admin). Itens criados por ele em casas compartilhadas pertencem à casa
   * e têm FK para users, então o registro do usuário é anonimizado em vez
   * de removido: todo dado pessoal (nome, telefone, senha, push token) é
   * apagado e o login fica impossível.
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.dataSource.transaction(async (em) => {
      const memberships = await em.find(HouseholdMember, { where: { userId } });

      for (const membership of memberships) {
        const members = await em.find(HouseholdMember, {
          where: { householdId: membership.householdId },
        });

        if (members.length === 1) {
          const householdId = membership.householdId;
          await em.delete(FridgeItem, { householdId });
          await em.delete(FridgeActivity, { householdId });
          await em.delete(ShoppingItem, { householdId });
          await em.delete(ShoppingList, { householdId });
          await em.delete(HouseholdCategory, { householdId });
          await em.delete(Storage, { householdId });
          await em.delete(HouseholdInvite, { householdId });
          await em.delete(HouseholdMember, { householdId });
          await em.delete(Household, { id: householdId });
          continue;
        }

        const others = members.filter((m) => m.userId !== userId);
        const isSoleAdmin =
          membership.role === 'admin' && !others.some((m) => m.role === 'admin');
        if (isSoleAdmin) {
          const successor = others.sort(
            (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
          )[0];
          await em.update(HouseholdMember, { id: successor.id }, { role: 'admin' });
        }
        await em.delete(HouseholdMember, { id: membership.id });
      }

      await em.delete(PushToken, { userId });
      await em.delete(RefreshToken, { userId });
      await em.delete(SmsOtp, { phone: user.phone });
      await em.update(FridgeActivity, { userId }, { userName: 'Usuário removido' });
      await em.update(
        User,
        { id: userId },
        {
          name: 'Usuário removido',
          phone: `deleted:${userId}`,
          email: null,
          password: await bcrypt.hash(randomUUID(), 10),
        },
      );
    });
  }
}

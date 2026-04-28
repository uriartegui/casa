import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
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
      select: { id: true, email: true, name: true, password: true, pushToken: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { phone },
      select: { id: true, email: true, name: true, password: true, pushToken: true },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.usersRepo.update(userId, { password: hashedPassword });
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.usersRepo.update(userId, { pushToken });
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
}

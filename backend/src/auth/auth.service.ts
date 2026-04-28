import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './refresh-token.entity';
import { SmsOtp, OtpType } from './sms-otp.entity';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private smsService: SmsService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(SmsOtp)
    private smsOtpRepo: Repository<SmsOtp>,
  ) {}

  async register(email: string, name: string, password: string, phone: string) {
    const user = await this.usersService.create(email, name, password, phone);
    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.generateTokens(user);
  }

  async refresh(token: string) {
    const prefix = token.substring(0, 8);
    const now = new Date();

    const candidates = await this.refreshTokenRepo
      .createQueryBuilder('rt')
      .where('rt.tokenPrefix = :prefix', { prefix })
      .andWhere('rt.revokedAt IS NULL')
      .andWhere('rt.expiresAt > :now', { now })
      .getMany();

    for (const candidate of candidates) {
      const match = await bcrypt.compare(token, candidate.token);
      if (match) {
        candidate.revokedAt = new Date();
        await this.refreshTokenRepo.save(candidate);

        const user = await this.usersService.findById(candidate.userId);
        if (!user) throw new UnauthorizedException('Usuário não encontrado');
        return this.generateTokens(user);
      }
    }

    throw new UnauthorizedException('Refresh token inválido ou expirado');
  }

  async logout(refreshToken: string) {
    const prefix = refreshToken.substring(0, 8);
    const now = new Date();

    const candidates = await this.refreshTokenRepo
      .createQueryBuilder('rt')
      .where('rt.tokenPrefix = :prefix', { prefix })
      .andWhere('rt.revokedAt IS NULL')
      .andWhere('rt.expiresAt > :now', { now })
      .getMany();

    for (const candidate of candidates) {
      const match = await bcrypt.compare(refreshToken, candidate.token);
      if (match) {
        candidate.revokedAt = new Date();
        await this.refreshTokenRepo.save(candidate);
        return;
      }
    }

    this.logger.warn(`Logout com token não encontrado (prefix: ${prefix})`);
  }

  async sendOtp(phone: string, type: OtpType) {
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentCount = await this.smsOtpRepo.count({
      where: { phone, type, createdAt: MoreThan(oneMinuteAgo) },
    });
    if (recentCount > 0) {
      throw new BadRequestException('Aguarde 1 minuto antes de solicitar novo código');
    }

    const code = String(randomInt(100000, 999999));
    const hashedCode = await bcrypt.hash(code, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.smsOtpRepo.create({
      phone,
      code: hashedCode,
      type,
      expiresAt,
      usedAt: null,
    });
    await this.smsOtpRepo.save(otp);

    await this.smsService.send(phone, `Seu código Colmeia: ${code}`);

    return { sent: true };
  }

  async verifyOtp(phone: string, code: string, type: OtpType) {
    const now = new Date();
    const otp = await this.smsOtpRepo
      .createQueryBuilder('o')
      .where('o.phone = :phone', { phone })
      .andWhere('o.type = :type', { type })
      .andWhere('o.usedAt IS NULL')
      .andWhere('o.expiresAt > :now', { now })
      .orderBy('o.createdAt', 'DESC')
      .getOne();

    if (!otp) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    const valid = await bcrypt.compare(code, otp.code);
    if (!valid) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    otp.usedAt = new Date();
    await this.smsOtpRepo.save(otp);

    return { valid: true };
  }

  async forgotPassword(phone: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      return { sent: true };
    }
    return this.sendOtp(phone, 'reset_password');
  }

  async resetPassword(phone: string, code: string, newPassword: string) {
    await this.verifyOtp(phone, code, 'reset_password');

    const user = await this.usersService.findByPhone(phone);
    if (!user) throw new BadRequestException('Usuário não encontrado');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashed);

    return { success: true };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredOtps() {
    const result = await this.smsOtpRepo.delete({ expiresAt: LessThan(new Date()) });
    this.logger.log(`OTP cleanup: ${result.affected ?? 0} registros removidos`);
  }

  private async generateTokens(user: { id: string; email: string; name: string }) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    const rawRefreshToken = randomUUID();
    const prefix = rawRefreshToken.substring(0, 8);
    const hashedToken = await bcrypt.hash(rawRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshTokenEntity = this.refreshTokenRepo.create({
      token: hashedToken,
      tokenPrefix: prefix,
      userId: user.id,
      expiresAt,
      revokedAt: null,
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}

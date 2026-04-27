import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { HouseholdMember } from '../households/household-member.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  private expo = new Expo();
  private logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(HouseholdMember)
    private membersRepo: Repository<HouseholdMember>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async notifyHouseholdMembers(
    householdId: string,
    excludeUserId: string,
    title: string,
    body: string,
  ): Promise<void> {
    const members = await this.membersRepo.find({ where: { householdId } });
    const otherUserIds = members
      .map((m) => m.userId)
      .filter((id) => id !== excludeUserId);

    if (otherUserIds.length === 0) return;

    const users = await this.usersRepo.find({
      where: { id: In(otherUserIds) },
    });

    const messages: ExpoPushMessage[] = users
      .filter((u) => u.pushToken && Expo.isExpoPushToken(u.pushToken))
      .map((u) => ({
        to: u.pushToken as string,
        title,
        body,
        sound: 'default' as const,
      }));

    if (messages.length === 0) {
      this.logger.log(`[${householdId}] Nenhum token válido para notificar`);
      return;
    }

    this.logger.log(`[${householdId}] Enviando notificação para ${messages.length} device(s): "${title}"`);
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const receipts = await this.expo.sendPushNotificationsAsync(chunk).catch((err) => {
        this.logger.error('Erro ao enviar push:', err?.message ?? err);
        return [];
      });
      for (const receipt of receipts) {
        if (receipt.status === 'error') {
          this.logger.error(`Push falhou: ${receipt.message}`, receipt.details);
        }
      }
    }
  }
}

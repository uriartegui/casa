import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { HouseholdMember } from '../households/household-member.entity';
import { PushToken } from '../users/push-token.entity';

export type PushNotificationOptions = {
  data?: Record<string, unknown>;
  categoryId?: string;
};

const NOTIFICATION_CHANNEL_ID = 'colmeia';
const NOTIFICATION_SOUND = 'colmeia_chime.wav';

@Injectable()
export class NotificationsService {
  private expo = new Expo();
  private logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(HouseholdMember)
    private membersRepo: Repository<HouseholdMember>,
    @InjectRepository(PushToken)
    private pushTokensRepo: Repository<PushToken>,
  ) {}

  private async getPushMessages(
    userIds: string[],
    title: string,
    body: string,
    options: PushNotificationOptions = {},
  ): Promise<ExpoPushMessage[]> {
    const tokens = await this.pushTokensRepo.find({ where: { userId: In(userIds) } });
    const uniqueTokens = Array.from(new Set(tokens.map((t) => t.token)));
    return uniqueTokens
      .filter((token) => Expo.isExpoPushToken(token))
      .map((token) => ({
        to: token,
        title,
        body,
        sound: { name: NOTIFICATION_SOUND },
        channelId: NOTIFICATION_CHANNEL_ID,
        data: options.data,
        categoryId: options.categoryId,
      }));
  }

  async notifyAllMembers(
    householdId: string,
    title: string,
    body: string,
    options?: PushNotificationOptions,
  ): Promise<void> {
    const members = await this.membersRepo.find({ where: { householdId } });
    const userIds = members.map((m) => m.userId);
    if (userIds.length === 0) return;

    const messages = await this.getPushMessages(userIds, title, body, options);

    if (messages.length === 0) {
      this.logger.log(`[${householdId}] Nenhum token válido`);
      return;
    }

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

  async notifyUsers(userIds: string[], title: string, body: string, options?: PushNotificationOptions): Promise<void> {
    if (userIds.length === 0) return;
    const messages = await this.getPushMessages(userIds, title, body, options);
    if (messages.length === 0) return;
    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      await this.expo.sendPushNotificationsAsync(chunk).catch((err) => {
        this.logger.error('Erro ao enviar push:', err?.message ?? err);
        return [];
      });
    }
  }

  async notifyHouseholdMembers(
    householdId: string,
    excludeUserId: string,
    title: string,
    body: string,
    options?: PushNotificationOptions,
  ): Promise<void> {
    const members = await this.membersRepo.find({ where: { householdId } });
    const otherUserIds = members
      .map((m) => m.userId)
      .filter((id) => id !== excludeUserId);

    if (otherUserIds.length === 0) return;

    const messages = await this.getPushMessages(otherUserIds, title, body, options);

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

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { HouseholdMember } from '../households/household-member.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  private expo = new Expo();

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

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk).catch(() => {});
    }
  }
}

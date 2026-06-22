import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseTask } from '../households/house-task.entity';
import { HouseTaskActivity } from '../households/house-task-activity.entity';
import { HouseholdMember } from '../households/household-member.entity';
import { NotificationLog } from './notification-log.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class TaskReminderService {
  private readonly logger = new Logger(TaskReminderService.name);

  constructor(
    @InjectRepository(HouseTask) private tasksRepo: Repository<HouseTask>,
    @InjectRepository(HouseTaskActivity) private activityRepo: Repository<HouseTaskActivity>,
    @InjectRepository(HouseholdMember) private membersRepo: Repository<HouseholdMember>,
    @InjectRepository(NotificationLog) private logsRepo: Repository<NotificationLog>,
    private notifications: NotificationsService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'America/Sao_Paulo' })
  async notifyDueTasks(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const tasks = await this.tasksRepo.find({ where: { done: false }, take: 500 });

    for (const task of tasks) {
      if (!task.dueDate || task.reminder === 'none') continue;
      const isDue = task.dueDate === today && task.reminder === 'due';
      const isTomorrow = task.dueDate === tomorrow && task.reminder === 'one_day_before';
      const isOverdue = task.dueDate < today;
      if (!isDue && !isTomorrow && !isOverdue) continue;

      const kind = isOverdue ? 'overdue' : isTomorrow ? 'tomorrow' : 'due';
      const dedupeKey = `${task.id}:${kind}:${today}`;
      if (await this.logsRepo.findOne({ where: { type: 'task_reminder', dedupeKey } })) continue;

      const members = await this.membersRepo.find({ where: { householdId: task.householdId } });
      const recipients = task.assignmentType === 'user' && task.assignedToId
        ? [task.assignedToId]
        : members.map((member) => member.userId);
      const body = isOverdue ? `${task.title} esta atrasada.` : isTomorrow ? `${task.title} vence amanha.` : `${task.title} precisa ser feita hoje.`;
      await this.notifications.notifyUsers(recipients, 'Tarefa da casa', body, { data: { type: 'task', householdId: task.householdId, taskId: task.id } });
      await this.logsRepo.save(this.logsRepo.create({ type: 'task_reminder', householdId: task.householdId, itemId: task.id, dedupeKey }));
      if (isOverdue) await this.activityRepo.save(this.activityRepo.create({ householdId: task.householdId, taskId: task.id, action: 'overdue', taskTitle: task.title, userId: task.createdById, userName: 'Colmeia', details: 'Tarefa atrasada' }));
    }
    this.logger.log('Lembretes de tarefas verificados.');
  }
}

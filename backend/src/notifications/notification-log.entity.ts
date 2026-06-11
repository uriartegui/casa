import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notification_logs')
@Index(['type', 'dedupeKey'], { unique: true })
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  householdId: string;

  @Column()
  dedupeKey: string;

  @Column({ type: 'uuid', nullable: true })
  itemId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Household } from './household.entity';
import { User } from '../users/user.entity';
import { ShoppingList } from './shopping-list.entity';

@Entity('house_tasks')
export class HouseTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ default: false })
  done: boolean;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';

  @Column({ type: 'varchar', default: 'unassigned' })
  assignmentType: 'unassigned' | 'all' | 'user';

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string | null;

  @Column({ type: 'uuid', nullable: true })
  shoppingListId: string | null;

  @Column({ type: 'varchar', default: 'none' })
  recurrence: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

  @Column({ type: 'integer', nullable: true })
  recurrenceIntervalDays: number | null;

  @Column({ type: 'varchar', default: 'none' })
  reminder: 'none' | 'due' | 'one_hour_before' | 'one_day_before';

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  completedById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => Household)
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completedById' })
  completedBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User | null;

  @ManyToOne(() => ShoppingList, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shoppingListId' })
  shoppingList: ShoppingList | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

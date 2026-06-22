import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('house_task_activity')
export class HouseTaskActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column({ type: 'uuid', nullable: true })
  taskId: string | null;

  @Column()
  action: 'created' | 'updated' | 'completed' | 'reopened' | 'deleted' | 'skipped' | 'overdue' | 'next_created';

  @Column()
  taskTitle: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

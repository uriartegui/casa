import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('storages')
export class Storage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  name: string;

  @Column({ default: '🧊' })
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;
}

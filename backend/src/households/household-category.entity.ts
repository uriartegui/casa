import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('household_categories')
export class HouseholdCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  storageId: string;

  @Column()
  label: string;

  @Column({ default: '📦' })
  emoji: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

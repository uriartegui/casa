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

  @Column({ default: '\u{1F4E6}' })
  emoji: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

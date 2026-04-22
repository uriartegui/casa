import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Household } from './household.entity';

@Entity('household_invites')
export class HouseholdInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column({ length: 5 })
  code: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @CreateDateColumn()
  createdAt: Date;
}

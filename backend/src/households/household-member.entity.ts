import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Household } from './household.entity';

export type MemberRole = 'admin' | 'member';

@Entity('household_members')
export class HouseholdMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  householdId: string;

  @Column({ default: 'member' })
  role: MemberRole;

  @ManyToOne(() => User, (user) => user.memberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Household, (household) => household.members)
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @CreateDateColumn()
  joinedAt: Date;
}

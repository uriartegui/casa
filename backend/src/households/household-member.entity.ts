import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Household } from './household.entity';

export type MemberRole = 'admin' | 'member';

@Unique(['userId', 'householdId'])
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

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;
}

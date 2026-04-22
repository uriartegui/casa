import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { HouseholdMember } from './household-member.entity';
import { FridgeItem } from './fridge-item.entity';

@Entity('households')
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => HouseholdMember, (member) => member.household)
  members: HouseholdMember[];

  @OneToMany(() => FridgeItem, (item) => item.household)
  fridgeItems: FridgeItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

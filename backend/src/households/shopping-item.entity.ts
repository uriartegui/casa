import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Household } from './household.entity';
import { User } from '../users/user.entity';

@Entity('shopping_items')
export class ShoppingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', default: 1 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ default: false })
  checked: boolean;

  @Column()
  createdById: string;

  @ManyToOne(() => Household)
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}

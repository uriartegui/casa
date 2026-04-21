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

@Entity('fridge_items')
export class FridgeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column({ type: 'uuid', nullable: true })
  storageId: string | null;

  @Column()
  name: string;

  @Column({ type: 'decimal', default: 1 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column()
  createdById: string;

  @ManyToOne(() => Household, (household) => household.fridgeItems)
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}

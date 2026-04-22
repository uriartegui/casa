import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Household } from './household.entity';
import { Storage } from './storage.entity';
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

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column()
  createdById: string;

  @ManyToOne(() => Storage, { nullable: true, eager: false })
  @JoinColumn({ name: 'storageId' })
  storage: Storage | null;

  @ManyToOne(() => Household, (household) => household.fridgeItems)
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'varchar', nullable: true })
  fromShoppingListName: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

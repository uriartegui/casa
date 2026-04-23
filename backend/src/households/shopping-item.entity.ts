import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Household } from './household.entity';
import { User } from '../users/user.entity';
import { ShoppingList } from './shopping-list.entity';

@Entity('shopping_items')
export class ShoppingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column({ type: 'uuid', nullable: true })
  shoppingListId: string | null;

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

  @ManyToOne(() => ShoppingList, { nullable: true })
  @JoinColumn({ name: 'shoppingListId' })
  shoppingList: ShoppingList | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}

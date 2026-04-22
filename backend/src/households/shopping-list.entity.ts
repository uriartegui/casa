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

@Entity('shopping_lists')
export class ShoppingList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  place: string | null;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column()
  createdById: string;

  @ManyToOne(() => Household)
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

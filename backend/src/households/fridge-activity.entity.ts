import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('fridge_activity')
export class FridgeActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  action: 'added' | 'removed' | 'updated';

  @Column()
  itemName: string;

  @Column({ type: 'decimal', nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  fromShoppingListName: string;

  @Column({ nullable: true })
  toShoppingListName: string;

  @Column({ nullable: true })
  storageId: string;

  @Column({ nullable: true })
  storageName: string;

  @Column({ nullable: true })
  storageEmoji: string;

  @Column({ nullable: true, type: 'text' })
  details: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

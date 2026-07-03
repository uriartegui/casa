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
  quantity: number | null;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  userName: string | null;

  @Column({ type: 'varchar', nullable: true })
  fromShoppingListName: string | null;

  @Column({ type: 'varchar', nullable: true })
  toShoppingListName: string | null;

  @Column({ type: 'uuid', nullable: true })
  storageId: string | null;

  @Column({ type: 'varchar', nullable: true })
  storageName: string | null;

  @Column({ type: 'varchar', nullable: true })
  storageEmoji: string | null;

  @Column({ nullable: true, type: 'text' })
  details: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

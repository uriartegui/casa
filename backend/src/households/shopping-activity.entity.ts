import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('shopping_activity')
export class ShoppingActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column({ type: 'uuid', nullable: true })
  shoppingListId: string | null;

  @Column()
  action: 'added' | 'removed' | 'checked' | 'unchecked' | 'sent_to_fridge' | 'list_created' | 'list_deleted';

  @Column()
  itemName: string;

  @Column({ type: 'varchar', nullable: true })
  listName: string | null;

  @Column({ type: 'decimal', nullable: true })
  quantity: number | null;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  userName: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

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

  @Column({ nullable: true })
  listName: string;

  @Column({ type: 'decimal', nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

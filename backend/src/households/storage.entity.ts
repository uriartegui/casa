import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('storages')
export class Storage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  name: string;

  @Column({ default: '\u{1F4E6}' })
  emoji: string;

  @Column({ default: false })
  hidden: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

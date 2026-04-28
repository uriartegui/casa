import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { HouseholdMember } from '../households/household-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, type: 'varchar' })
  email: string | null;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true, type: 'text' })
  pushToken: string | null;

  @Column({ type: 'varchar', unique: true })
  phone: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => HouseholdMember, (member) => member.user)
  memberships: HouseholdMember[];
}

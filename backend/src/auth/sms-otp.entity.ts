import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type OtpType = 'register' | 'reset_password';

@Entity('sms_otps')
export class SmsOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  type: OtpType;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

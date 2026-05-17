import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentScheduleType } from '../enums/payment-schedule-type.enum';
import { PaymentScheduleStatus } from '../enums/payment-schedule-status.enum';
import { PaymentIntent } from './payment-intent.entity';
import { Transaction } from './transaction.entity';
import { ColumnNumericTransformer } from '../utils/column-numeric.transformer';

@Entity('payment_schedules')
export class PaymentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentIntentId: string;

  @Column({
    type: 'enum',
    enum: PaymentScheduleType,
  })
  type: PaymentScheduleType;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentScheduleStatus,
    default: PaymentScheduleStatus.Pending,
  })
  status: PaymentScheduleStatus;

  @Column({ nullable: true })
  paystackReference?: string | null;

  @Column({ nullable: true })
  paystackAuthorizationUrl?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => PaymentIntent, (intent) => intent.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent: PaymentIntent;

  @OneToMany(() => Transaction, (transaction) => transaction.paymentSchedule)
  transactions: Transaction[];
}

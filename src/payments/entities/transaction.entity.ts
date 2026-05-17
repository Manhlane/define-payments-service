import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { PaymentIntent } from './payment-intent.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { ColumnNumericTransformer } from '../utils/column-numeric.transformer';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentIntentId: string;

  @Column({ type: 'uuid' })
  paymentScheduleId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column()
  provider: string;

  @Column({ unique: true })
  reference: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.Pending,
  })
  status: TransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  rawResponse?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => PaymentIntent, (intent) => intent.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent: PaymentIntent;

  @ManyToOne(() => PaymentSchedule, (schedule) => schedule.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentScheduleId' })
  paymentSchedule: PaymentSchedule;
}

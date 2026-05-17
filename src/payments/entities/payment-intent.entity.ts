import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentIntentStatus } from '../enums/payment-intent-status.enum';
import { PaymentSchedule } from './payment-schedule.entity';
import { Transaction } from './transaction.entity';
import { Payout } from './payout.entity';
import { Deliverable } from './deliverable.entity';
import { Dispute } from './dispute.entity';
import { ColumnNumericTransformer } from '../utils/column-numeric.transformer';

@Entity('payment_intents')
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  publicId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  clientName: string;

  @Column()
  clientEmail: string;

  @Column()
  clientPhone: string;

  @Column({ type: 'text' })
  serviceDescription: string;

  @Column({ type: 'timestamptz' })
  shootDate: Date;

  @Column({ type: 'timestamptz' })
  deliveryDate: Date;

  @Column({ length: 3 })
  currency: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.Pending,
  })
  status: PaymentIntentStatus;

  @Column({ default: false })
  requireDeposit: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => PaymentSchedule, (schedule) => schedule.paymentIntent)
  schedules: PaymentSchedule[];

  @OneToMany(() => Transaction, (transaction) => transaction.paymentIntent)
  transactions: Transaction[];

  @OneToMany(() => Payout, (payout) => payout.paymentIntent)
  payouts: Payout[];

  @OneToMany(() => Deliverable, (deliverable) => deliverable.paymentIntent)
  deliverables: Deliverable[];

  @OneToMany(() => Dispute, (dispute) => dispute.paymentIntent)
  disputes: Dispute[];
}

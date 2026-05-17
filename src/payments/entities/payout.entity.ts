import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PayoutStatus } from '../enums/payout-status.enum';
import { PaymentIntent } from './payment-intent.entity';
import { ColumnNumericTransformer } from '../utils/column-numeric.transformer';

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentIntentId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.Pending,
  })
  status: PayoutStatus;

  @Column({ type: 'timestamptz', nullable: true })
  releasedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => PaymentIntent, (intent) => intent.payouts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent: PaymentIntent;
}

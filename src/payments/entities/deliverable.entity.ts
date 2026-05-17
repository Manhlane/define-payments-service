import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentIntent } from './payment-intent.entity';

@Entity('deliverables')
export class Deliverable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentIntentId: string;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => PaymentIntent, (intent) => intent.deliverables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent: PaymentIntent;
}

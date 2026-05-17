import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthClient } from '../../auth/auth.client';
import { PaymentIntent } from '../entities/payment-intent.entity';
import { PaymentSchedule } from '../entities/payment-schedule.entity';
import { Transaction } from '../entities/transaction.entity';
import { Payout } from '../entities/payout.entity';
import { Deliverable } from '../entities/deliverable.entity';
import { Dispute } from '../entities/dispute.entity';
import { PaymentIntentRepository } from '../repositories/payment-intent.repository';
import { PaymentScheduleRepository } from '../repositories/payment-schedule.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PayoutRepository } from '../repositories/payout.repository';
import { DeliverableRepository } from '../repositories/deliverable.repository';
import { DisputeRepository } from '../repositories/dispute.repository';
import { PaymentIntentsService } from '../services/payment-intents.service';
import { PaymentSchedulesService } from '../services/payment-schedules.service';
import { PaystackService } from '../services/paystack.service';
import { WebhookService } from '../services/webhook.service';
import { PayoutsService } from '../services/payouts.service';
import { PaymentIntentController } from '../controllers/payment-intent.controller';
import { PaymentScheduleController } from '../controllers/payment-schedule.controller';
import { PaymentController } from '../controllers/payment.controller';
import { DeliveryController } from '../controllers/delivery.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentIntent,
      PaymentSchedule,
      Transaction,
      Payout,
      Deliverable,
      Dispute,
    ]),
  ],
  controllers: [
    PaymentIntentController,
    PaymentScheduleController,
    PaymentController,
    DeliveryController,
  ],
  providers: [
    AuthClient,
    PaystackService,
    PaymentIntentsService,
    PaymentSchedulesService,
    WebhookService,
    PayoutsService,
    PaymentIntentRepository,
    PaymentScheduleRepository,
    TransactionRepository,
    PayoutRepository,
    DeliverableRepository,
    DisputeRepository,
  ],
  exports: [PaymentIntentsService],
})
export class PaymentsModule {}

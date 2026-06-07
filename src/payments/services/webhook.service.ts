import { Injectable, Logger } from '@nestjs/common';
import { PaymentScheduleRepository } from '../repositories/payment-schedule.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PaystackService } from './paystack.service';
import { PaymentScheduleStatus } from '../enums/payment-schedule-status.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { PaymentIntentsService } from './payment-intents.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly paymentScheduleRepository: PaymentScheduleRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly paymentIntentsService: PaymentIntentsService,
  ) {}

  async handlePaystackWebhook(
    signature: string | undefined,
    rawBody: Buffer | undefined,
    payload: Record<string, any>,
  ): Promise<void> {
    if (!this.paystackService.isSignatureValid(signature, rawBody)) {
      this.logger.warn('Invalid Paystack webhook signature.');
      return;
    }

    if (payload?.event !== 'charge.success') {
      return;
    }

    const reference = payload?.data?.reference as string | undefined;
    if (!reference) {
      this.logger.warn('Paystack webhook missing reference.');
      return;
    }

    const schedule =
      await this.paymentScheduleRepository.findByReference(reference);
    if (!schedule) {
      this.logger.warn(`No payment schedule found for reference ${reference}.`);
      return;
    }

    if (schedule.status === PaymentScheduleStatus.Paid) {
      return;
    }

    const existingTransaction =
      await this.transactionRepository.findByReference(reference);
    if (existingTransaction) {
      return;
    }

    const amount = this.paystackService.fromPaystackAmount(
      payload?.data?.amount,
    );
    const currency =
      (payload?.data?.currency as string | undefined) ??
      schedule.paymentIntent.currency;

    const transaction = this.transactionRepository.create({
      paymentIntentId: schedule.paymentIntentId,
      paymentScheduleId: schedule.id,
      type: TransactionType.Charge,
      provider: 'paystack',
      reference,
      amount: amount || schedule.amount,
      currency,
      status: TransactionStatus.Success,
      rawResponse: payload,
    });

    await this.transactionRepository.save(transaction);

    schedule.status = PaymentScheduleStatus.Paid;
    schedule.paidAt = new Date();
    await this.paymentScheduleRepository.save(schedule);

    await this.paymentIntentsService.updatePaymentIntentStatus(
      schedule.paymentIntentId,
    );
  }
}

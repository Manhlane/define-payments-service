import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentIntentRepository } from '../repositories/payment-intent.repository';
import { PaymentScheduleRepository } from '../repositories/payment-schedule.repository';
import { PayoutRepository } from '../repositories/payout.repository';
import { PaymentIntentStatus } from '../enums/payment-intent-status.enum';
import { PaymentScheduleStatus } from '../enums/payment-schedule-status.enum';
import { PayoutStatus } from '../enums/payout-status.enum';
import { Payout } from '../entities/payout.entity';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly paymentScheduleRepository: PaymentScheduleRepository,
    private readonly payoutRepository: PayoutRepository,
  ) {}

  async releaseFunds(paymentIntentId: string): Promise<Payout> {
    const intent = await this.paymentIntentRepository.findByIdOrPublicId(paymentIntentId);
    if (!intent) {
      throw new NotFoundException('Payment intent not found.');
    }

    if (intent.status === PaymentIntentStatus.Disputed) {
      throw new BadRequestException('Payment intent is disputed.');
    }

    const schedules = intent.schedules ??
      (await this.paymentScheduleRepository.findByIntentId(intent.id));

    const unpaid = schedules.filter(
      (schedule) => schedule.status !== PaymentScheduleStatus.Paid,
    );
    if (unpaid.length > 0) {
      throw new BadRequestException('All schedules must be paid before payout.');
    }

    const existing = intent.payouts?.find(
      (payout) => payout.status !== PayoutStatus.Failed,
    );
    if (existing) {
      return existing;
    }

    let payout = this.payoutRepository.create({
      paymentIntentId: intent.id,
      userId: intent.userId,
      amount: intent.totalAmount,
      status: PayoutStatus.Processing,
    });

    payout = await this.payoutRepository.save(payout);

    payout.status = PayoutStatus.Paid;
    payout.releasedAt = new Date();
    payout = await this.payoutRepository.save(payout);

    intent.status = PaymentIntentStatus.Completed;
    await this.paymentIntentRepository.save(intent);

    this.logger.log(`Payout ${payout.id} released for payment intent ${intent.id}`);

    return payout;
  }
}

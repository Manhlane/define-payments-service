import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentScheduleRepository } from '../repositories/payment-schedule.repository';
import { PaystackService } from './paystack.service';
import { PaymentScheduleStatus } from '../enums/payment-schedule-status.enum';
import { InitializePaymentResponseDto } from '../dto/initialize-payment-response.dto';

@Injectable()
export class PaymentSchedulesService {
  constructor(
    private readonly paymentScheduleRepository: PaymentScheduleRepository,
    private readonly paystackService: PaystackService,
  ) {}

  async initializePayment(scheduleId: string): Promise<InitializePaymentResponseDto> {
    const schedule = await this.paymentScheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException('Payment schedule not found.');
    }

    if (schedule.status === PaymentScheduleStatus.Paid) {
      throw new BadRequestException('Payment schedule is already paid.');
    }

    const intent = schedule.paymentIntent;
    const result = await this.paystackService.initializePayment(schedule, intent);

    schedule.paystackReference = result.reference;
    schedule.paystackAuthorizationUrl = result.authorizationUrl;
    await this.paymentScheduleRepository.save(schedule);

    return {
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    };
  }
}

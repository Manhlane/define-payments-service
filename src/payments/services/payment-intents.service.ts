import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentIntentRepository } from '../repositories/payment-intent.repository';
import { PaymentScheduleRepository } from '../repositories/payment-schedule.repository';
import { DeliverableRepository } from '../repositories/deliverable.repository';
import {
  CreatePaymentIntentDto,
  DepositType,
} from '../dto/create-payment-intent.dto';
import { UpdatePaymentIntentDto } from '../dto/update-payment-intent.dto';
import { PaymentIntent } from '../entities/payment-intent.entity';
import { PaymentSchedule } from '../entities/payment-schedule.entity';
import { PaymentIntentStatus } from '../enums/payment-intent-status.enum';
import { PaymentScheduleStatus } from '../enums/payment-schedule-status.enum';
import { PaymentScheduleType } from '../enums/payment-schedule-type.enum';
import { PaystackService } from './paystack.service';
import { PaymentIntentResponseDto } from '../dto/payment-intent-response.dto';
import { PaymentScheduleResponseDto } from '../dto/payment-schedule-response.dto';
import { PaymentLinkResponseDto } from '../dto/payment-link-response.dto';
import { AuthUser } from '../../auth/auth.client';

@Injectable()
export class PaymentIntentsService {
  private readonly logger = new Logger(PaymentIntentsService.name);

  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly paymentScheduleRepository: PaymentScheduleRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly paystackService: PaystackService,
  ) {}

  async createPaymentIntent(
    payload: CreatePaymentIntentDto,
    user?: AuthUser | null,
  ): Promise<PaymentIntentResponseDto> {
    const resolvedUserId = user?.id ?? payload.userId;
    if (!resolvedUserId) {
      throw new UnauthorizedException(
        'User is required to create a payment intent.',
      );
    }

    const totalAmount = this.normalizeAmount(payload.totalAmount);
    if (totalAmount <= 0) {
      throw new BadRequestException('totalAmount must be greater than zero.');
    }

    const shootDate = this.parseDate(payload.shootDate, 'shootDate');
    const deliveryDate = this.parseDate(payload.deliveryDate, 'deliveryDate');

    const requireDeposit = Boolean(payload.requireDeposit);
    const depositType = payload.depositType ?? DepositType.Percentage;
    const depositValue = payload.depositValue ?? 0;

    let depositAmount = 0;
    if (requireDeposit) {
      if (depositType === DepositType.Percentage) {
        if (depositValue <= 0 || depositValue > 100) {
          throw new BadRequestException(
            'depositValue must be between 1 and 100.',
          );
        }
        depositAmount = (totalAmount * depositValue) / 100;
      } else {
        if (depositValue <= 0) {
          throw new BadRequestException(
            'depositValue must be greater than zero.',
          );
        }
        depositAmount = depositValue;
      }
      depositAmount = Math.min(depositAmount, totalAmount);
    }

    const remainderAmount = Math.max(totalAmount - depositAmount, 0);

    const intent = this.paymentIntentRepository.create({
      publicId: this.generatePublicId(),
      slug: this.generateSlug(),
      userId: resolvedUserId,
      clientName: payload.clientName.trim(),
      clientEmail: payload.clientEmail.trim(),
      clientPhone: payload.clientPhone.trim(),
      serviceDescription: payload.serviceDescription.trim(),
      shootDate,
      deliveryDate,
      currency: payload.currency.trim().toUpperCase(),
      totalAmount,
      status: PaymentIntentStatus.Pending,
      requireDeposit,
    });

    const savedIntent = await this.paymentIntentRepository.save(intent);

    const schedules = this.buildSchedules(
      savedIntent,
      depositAmount,
      remainderAmount,
    );
    await this.paymentScheduleRepository.saveMany(schedules);

    if (payload.deliverables && payload.deliverables.length > 0) {
      const deliverables = payload.deliverables.map((item) =>
        this.deliverableRepository.create({
          paymentIntentId: savedIntent.id,
          title: item.title.trim(),
          type: item.type.trim(),
          quantity: Math.max(Math.round(item.quantity), 1),
        }),
      );
      await this.deliverableRepository.saveMany(deliverables);
    }

    await this.updatePaymentIntentStatus(savedIntent.id);

    const refreshed = await this.getPaymentIntent(savedIntent.id);
    return this.toPaymentIntentResponse(refreshed);
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    const intent = await this.paymentIntentRepository.findByIdOrPublicId(id);
    if (!intent) {
      throw new NotFoundException('Payment intent not found.');
    }
    return intent;
  }

  async updatePaymentIntent(
    id: string,
    payload: UpdatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    const intent = await this.getPaymentIntent(id);

    if (payload.clientName) intent.clientName = payload.clientName.trim();
    if (payload.clientEmail) intent.clientEmail = payload.clientEmail.trim();
    if (payload.clientPhone) intent.clientPhone = payload.clientPhone.trim();
    if (payload.serviceDescription) {
      intent.serviceDescription = payload.serviceDescription.trim();
    }
    if (payload.shootDate) {
      intent.shootDate = this.parseDate(payload.shootDate, 'shootDate');
    }
    if (payload.deliveryDate) {
      intent.deliveryDate = this.parseDate(
        payload.deliveryDate,
        'deliveryDate',
      );
    }
    if (payload.currency)
      intent.currency = payload.currency.trim().toUpperCase();

    const saved = await this.paymentIntentRepository.save(intent);
    const refreshed = await this.getPaymentIntent(saved.id);
    return this.toPaymentIntentResponse(refreshed);
  }

  async getPaymentLinks(id: string): Promise<PaymentLinkResponseDto> {
    const intent = await this.getPaymentIntent(id);
    const schedules =
      intent.schedules ??
      (await this.paymentScheduleRepository.findByIntentId(intent.id));

    const depositSchedule = schedules.find(
      (schedule) => schedule.type === PaymentScheduleType.Deposit,
    );
    const remainderSchedule = schedules.find(
      (schedule) =>
        schedule.type === PaymentScheduleType.Remainder ||
        schedule.type === PaymentScheduleType.Full,
    );

    const depositLink = await this.ensurePaymentLink(intent, depositSchedule);
    const remainderLink = await this.ensurePaymentLink(
      intent,
      remainderSchedule,
    );

    return {
      depositAuthorizationUrl: depositLink?.authorizationUrl ?? null,
      depositReference: depositLink?.reference ?? null,
      remainderAuthorizationUrl: remainderLink?.authorizationUrl ?? null,
      remainderReference: remainderLink?.reference ?? null,
    };
  }

  async updatePaymentIntentStatus(intentId: string): Promise<void> {
    const intent = await this.paymentIntentRepository.findById(intentId);
    if (!intent) return;

    if (
      intent.status === PaymentIntentStatus.Completed ||
      intent.status === PaymentIntentStatus.Disputed
    ) {
      return;
    }

    const schedules =
      intent.schedules ??
      (await this.paymentScheduleRepository.findByIntentId(intent.id));

    const relevantSchedules = schedules.filter(
      (schedule) => schedule.amount > 0,
    );
    const targetSchedules =
      relevantSchedules.length > 0 ? relevantSchedules : schedules;
    const paidCount = targetSchedules.filter(
      (schedule) => schedule.status === PaymentScheduleStatus.Paid,
    ).length;

    let nextStatus = PaymentIntentStatus.Pending;
    if (paidCount === 0) {
      nextStatus = PaymentIntentStatus.Pending;
    } else if (paidCount < targetSchedules.length) {
      nextStatus = PaymentIntentStatus.PartiallyPaid;
    } else {
      nextStatus = PaymentIntentStatus.Paid;
    }

    if (intent.status !== nextStatus) {
      intent.status = nextStatus;
      await this.paymentIntentRepository.save(intent);
    }
  }

  toPaymentIntentResponse(intent: PaymentIntent): PaymentIntentResponseDto {
    const schedules = (intent.schedules ?? []).map((schedule) =>
      this.toScheduleResponse(schedule),
    );

    return {
      id: intent.id,
      publicId: intent.publicId,
      slug: intent.slug,
      userId: intent.userId,
      clientName: intent.clientName,
      clientEmail: intent.clientEmail,
      clientPhone: intent.clientPhone,
      serviceDescription: intent.serviceDescription,
      shootDate: intent.shootDate,
      deliveryDate: intent.deliveryDate,
      currency: intent.currency,
      totalAmount: intent.totalAmount,
      status: intent.status,
      requireDeposit: intent.requireDeposit,
      schedules,
      createdAt: intent.createdAt,
      updatedAt: intent.updatedAt,
    };
  }

  private toScheduleResponse(
    schedule: PaymentSchedule,
  ): PaymentScheduleResponseDto {
    return {
      id: schedule.id,
      type: schedule.type,
      amount: schedule.amount,
      dueDate: schedule.dueDate,
      status: schedule.status,
      paystackReference: schedule.paystackReference ?? null,
      paystackAuthorizationUrl: schedule.paystackAuthorizationUrl ?? null,
      paidAt: schedule.paidAt ?? null,
    };
  }

  private buildSchedules(
    intent: PaymentIntent,
    depositAmount: number,
    remainderAmount: number,
  ): PaymentSchedule[] {
    const now = new Date();
    const schedules: PaymentSchedule[] = [];

    if (intent.requireDeposit) {
      schedules.push(
        this.paymentScheduleRepository.create({
          paymentIntentId: intent.id,
          type: PaymentScheduleType.Deposit,
          amount: depositAmount,
          dueDate: now,
          status:
            depositAmount > 0
              ? PaymentScheduleStatus.Pending
              : PaymentScheduleStatus.Paid,
          paidAt: depositAmount > 0 ? null : now,
        }),
      );

      schedules.push(
        this.paymentScheduleRepository.create({
          paymentIntentId: intent.id,
          type: PaymentScheduleType.Remainder,
          amount: remainderAmount,
          dueDate: intent.deliveryDate,
          status:
            remainderAmount > 0
              ? PaymentScheduleStatus.Pending
              : PaymentScheduleStatus.Paid,
          paidAt: remainderAmount > 0 ? null : now,
        }),
      );
    } else {
      schedules.push(
        this.paymentScheduleRepository.create({
          paymentIntentId: intent.id,
          type: PaymentScheduleType.Full,
          amount: intent.totalAmount,
          dueDate: now,
          status: PaymentScheduleStatus.Pending,
        }),
      );
    }

    return schedules;
  }

  private async ensurePaymentLink(
    intent: PaymentIntent,
    schedule?: PaymentSchedule,
  ): Promise<{ authorizationUrl: string; reference: string } | null> {
    if (!schedule) return null;
    if (schedule.status === PaymentScheduleStatus.Paid) {
      return null;
    }
    if (schedule.paystackReference && schedule.paystackAuthorizationUrl) {
      return {
        authorizationUrl: schedule.paystackAuthorizationUrl,
        reference: schedule.paystackReference,
      };
    }

    const result = await this.paystackService.initializePayment(
      schedule,
      intent,
    );
    schedule.paystackReference = result.reference;
    schedule.paystackAuthorizationUrl = result.authorizationUrl;
    await this.paymentScheduleRepository.save(schedule);
    return result;
  }

  private generatePublicId(): string {
    return `pi_${randomUUID()}`;
  }

  private generateSlug(): string {
    const numeric = parseInt(randomUUID().replace(/-/g, '').slice(0, 8), 16);
    return numeric.toString(36).padStart(6, '0').slice(0, 6);
  }

  private normalizeAmount(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(value, 0);
  }

  private parseDate(value: string, field: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid date.`);
    }
    return parsed;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreatePaymentRequestDto,
  DepositMode,
} from './dto/create-payment-request.dto';
import { NotificationsClient } from '../notifications/notifications.client';
import { AuthUser } from '../auth/auth.client';

export type PaymentRequest = {
  id: string;
  status: 'pending' | 'sent';
  createdAt: string;
  updatedAt: string;
  amount: number;
  currency: string;
  serviceDescription: string;
  clientEmail?: string;
  clientName?: string;
  deliverables: string[];
  shootDate?: string;
  deliveryDate?: string;
  paymentDueBy?: string;
  platformFeeRate: number;
  platformFee: number;
  clientPays: number;
  requireDeposit: boolean;
  depositMode?: 'percent' | 'fixed';
  depositPercent?: number;
  depositFixed?: number;
  depositAmount: number;
  depositFee: number;
  clientPaysNow: number;
  remainderAmount: number;
  remainderFee: number;
  clientPaysLater: number;
  createdBy?: AuthUser | null;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly store = new Map<string, PaymentRequest>();

  constructor(private readonly notificationsClient: NotificationsClient) {}

  list(): PaymentRequest[] {
    return Array.from(this.store.values());
  }

  getById(id: string): PaymentRequest | undefined {
    return this.store.get(id);
  }

  async create(
    payload: CreatePaymentRequestDto,
    createdBy?: AuthUser | null,
  ): Promise<PaymentRequest> {
    const now = new Date().toISOString();
    const amount = this.normalizeAmount(payload.amount);
    const currency = this.normalizeCurrency(payload.currency);
    const deliverables = this.normalizeDeliverables(payload.deliverables);

    const requireDeposit = Boolean(payload.requireDeposit);
    const depositMode = payload.depositMode ?? DepositMode.Percent;
    const depositPercent = this.clamp(payload.depositPercent ?? 50, 0, 100);
    const depositFixed = Math.max(payload.depositFixed ?? 0, 0);
    const rawDeposit = requireDeposit
      ? depositMode === DepositMode.Percent
        ? amount * (depositPercent / 100)
        : depositFixed
      : 0;
    const depositAmount = requireDeposit ? Math.min(rawDeposit, amount) : 0;
    const remainderAmount = Math.max(amount - depositAmount, 0);

    const platformFeeRate = this.platformFeeRate();
    const platformFee = amount * platformFeeRate;
    const depositFee = depositAmount * platformFeeRate;
    const remainderFee = remainderAmount * platformFeeRate;

    const clientPays = amount + platformFee;
    const clientPaysNow = depositAmount + depositFee;
    const clientPaysLater = remainderAmount + remainderFee;

    const record: PaymentRequest = {
      id: randomUUID(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      amount,
      currency,
      serviceDescription: payload.serviceDescription.trim(),
      clientEmail: payload.clientEmail?.trim(),
      clientName: payload.clientName?.trim(),
      deliverables,
      shootDate: payload.shootDate,
      deliveryDate: payload.deliveryDate,
      paymentDueBy: payload.paymentDueBy,
      platformFeeRate,
      platformFee,
      clientPays,
      requireDeposit,
      depositMode: requireDeposit ? depositMode : undefined,
      depositPercent:
        requireDeposit && depositMode === DepositMode.Percent
          ? depositPercent
          : undefined,
      depositFixed:
        requireDeposit && depositMode === DepositMode.Fixed
          ? depositFixed
          : undefined,
      depositAmount,
      depositFee,
      clientPaysNow,
      remainderAmount,
      remainderFee,
      clientPaysLater,
      createdBy,
    };

    this.store.set(record.id, record);

    if (record.clientEmail) {
      await this.notificationsClient
        .sendPaymentRequestEmail({
          email: record.clientEmail,
          amount: record.amount,
          currency: record.currency,
          serviceDescription: record.serviceDescription,
        })
        .catch((error) => {
          this.logger.warn(
            `Failed to send payment notification: ${String(error)}`,
          );
        });
    }

    return record;
  }

  private platformFeeRate(): number {
    const raw = Number(process.env.PLATFORM_FEE_RATE ?? '0.05');
    if (!Number.isFinite(raw) || raw < 0) return 0.05;
    return raw;
  }

  private normalizeAmount(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(value, 0);
  }

  private normalizeCurrency(value?: string): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed.toUpperCase() : 'ZAR';
  }

  private normalizeDeliverables(deliverables?: string[]): string[] {
    if (!deliverables) return [];
    return deliverables
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}

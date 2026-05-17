import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import { PaymentSchedule } from '../entities/payment-schedule.entity';
import { PaymentIntent } from '../entities/payment-intent.entity';

export type PaystackInitializeResult = {
  authorizationUrl: string;
  reference: string;
};

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl: string;
  private readonly secretKey?: string;
  private readonly amountMultiplier: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('PAYSTACK_BASE_URL') ??
      'https://api.paystack.co';
    this.secretKey =
      this.configService.get<string>('PAYSTACK_SECRET_KEY') ??
      this.configService.get<string>('PAYSTACK_SECRET');
    const multiplier = Number(
      this.configService.get<string>('PAYSTACK_AMOUNT_MULTIPLIER') ?? 100,
    );
    this.amountMultiplier = Number.isFinite(multiplier) ? multiplier : 100;
  }

  async initializePayment(
    schedule: PaymentSchedule,
    intent: PaymentIntent,
  ): Promise<PaystackInitializeResult> {
    const reference = this.generateReference();
    const payload = {
      email: intent.clientEmail,
      amount: this.toPaystackAmount(schedule.amount),
      reference,
      metadata: {
        paymentScheduleId: schedule.id,
        paymentIntentId: intent.id,
        paymentIntentPublicId: intent.publicId,
      },
    };

    const response = await this.request('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Paystack initialize failed: ${response.status} ${text}`);
      throw new Error('Failed to initialize Paystack payment.');
    }

    const data = (await response.json()) as {
      data?: { authorization_url?: string; reference?: string };
    };

    const authorizationUrl = data?.data?.authorization_url;
    const returnedReference = data?.data?.reference ?? reference;

    if (!authorizationUrl) {
      this.logger.error('Paystack initialize returned no authorization_url');
      throw new Error('Paystack did not return a payment link.');
    }

    return {
      authorizationUrl,
      reference: returnedReference,
    };
  }

  async verifyPayment(reference: string): Promise<unknown> {
    const response = await this.request(`/transaction/verify/${reference}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.warn(`Paystack verify failed: ${response.status} ${text}`);
      throw new Error('Failed to verify Paystack payment.');
    }

    return response.json();
  }

  isSignatureValid(signature: string | undefined, rawBody?: Buffer): boolean {
    if (!signature || !rawBody || !this.secretKey) {
      return false;
    }
    const hash = createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }

  private toPaystackAmount(amount: number): number {
    return Math.round(amount * this.amountMultiplier);
  }

  fromPaystackAmount(amount: number | string | undefined): number {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || this.amountMultiplier === 0) {
      return 0;
    }
    return numeric / this.amountMultiplier;
  }

  private generateReference(): string {
    return `ps_${randomUUID()}`;
  }

  private async request(
    path: string,
    options: RequestInit,
  ): Promise<Response> {
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured.');
    }
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  }
}

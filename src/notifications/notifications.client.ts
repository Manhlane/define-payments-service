import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type PaymentNotificationPayload = {
  email: string;
  amount: number;
  currency: string;
  serviceDescription: string;
};

@Injectable()
export class NotificationsClient {
  private readonly logger = new Logger(NotificationsClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.normalizeBaseUrl(
      this.configService.get<string>('NOTIFICATIONS_URL') ??
        this.configService.get<string>('NOTIFICATIONS_SERVICE_URL') ??
        'http://localhost:3005/notifications',
    );
  }

  async sendPaymentRequestEmail(payload: PaymentNotificationPayload): Promise<void> {
    const subject = `Payment request for ${payload.serviceDescription}`;
    const body = `You have a new payment request for ${payload.currency} ${Math.round(
      payload.amount,
    ).toLocaleString()}.`;

    await this.post('', {
      channel: 'email',
      recipient: payload.email,
      subject,
      body,
      metadata: {
        template: 'payment-request',
        service: payload.serviceDescription,
        amount: payload.amount,
        currency: payload.currency,
      },
    });
  }

  private normalizeBaseUrl(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  private async post(path: string, body: unknown): Promise<void> {
    const url = `${this.baseUrl}${path ? `/${path.replace(/^\//, '')}` : ''}`;
    const fetchImpl = this.getFetch();

    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(
          `Notifications service responded with ${response.status}: ${text}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to reach notifications service at ${url}`,
        error as Error,
      );
    }
  }

  private getFetch(): typeof fetch {
    if (typeof fetch === 'function') {
      return fetch;
    }
    throw new Error('Fetch API is not available in this environment.');
  }
}

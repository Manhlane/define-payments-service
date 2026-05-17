import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { RawBodyRequest } from '../types/raw-body-request';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest,
    @Body() body: Record<string, any>,
    @Headers('x-paystack-signature') signature?: string,
  ): Promise<{ received: boolean }> {
    await this.webhookService.handlePaystackWebhook(
      signature,
      req.rawBody,
      body,
    );
    return { received: true };
  }
}

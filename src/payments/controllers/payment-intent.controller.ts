import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthClient } from '../../auth/auth.client';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { UpdatePaymentIntentDto } from '../dto/update-payment-intent.dto';
import { PaymentIntentResponseDto } from '../dto/payment-intent-response.dto';
import { PaymentLinkResponseDto } from '../dto/payment-link-response.dto';
import { PaymentIntentsService } from '../services/payment-intents.service';

@ApiTags('payment-intents')
@Controller('payment-intents')
export class PaymentIntentController {
  constructor(
    private readonly paymentIntentsService: PaymentIntentsService,
    private readonly authClient: AuthClient,
  ) {}

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PaymentIntentResponseDto })
  @Post()
  async create(
    @Body() payload: CreatePaymentIntentDto,
    @Headers('authorization') authorization?: string,
  ): Promise<PaymentIntentResponseDto> {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : undefined;
    const user = await this.authClient.getCurrentUser(token);

    return this.paymentIntentsService.createPaymentIntent(payload, user?.id ?? null);
  }

  @ApiOkResponse({ type: PaymentIntentResponseDto })
  @Get(':id')
  async getById(@Param('id') id: string): Promise<PaymentIntentResponseDto> {
    const intent = await this.paymentIntentsService.getPaymentIntent(id);
    return this.paymentIntentsService.toPaymentIntentResponse(intent);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaymentIntentResponseDto })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: UpdatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.paymentIntentsService.updatePaymentIntent(id, payload);
  }

  @ApiOkResponse({ type: PaymentLinkResponseDto })
  @Get(':id/payment-links')
  async getPaymentLinks(@Param('id') id: string): Promise<PaymentLinkResponseDto> {
    return this.paymentIntentsService.getPaymentLinks(id);
  }
}

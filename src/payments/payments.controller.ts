import { Body, Controller, Get, Headers, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthClient } from '../auth/auth.client';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly authClient: AuthClient,
  ) {}

  @ApiOkResponse({ type: PaymentRequestDto, isArray: true })
  @Get()
  list(): PaymentRequestDto[] {
    return this.paymentsService.list();
  }

  @ApiOkResponse({ type: PaymentRequestDto })
  @Get(':id')
  findOne(@Param('id') id: string): PaymentRequestDto {
    const record = this.paymentsService.getById(id);
    if (!record) {
      throw new NotFoundException('Payment request not found');
    }
    return record;
  }

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PaymentRequestDto })
  @Post()
  async create(
    @Body() payload: CreatePaymentRequestDto,
    @Headers('authorization') authorization?: string,
  ): Promise<PaymentRequestDto> {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : undefined;
    const user = await this.authClient.getCurrentUser(token);
    return this.paymentsService.create(payload, user);
  }
}

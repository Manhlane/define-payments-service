import { Controller, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InitializePaymentResponseDto } from '../dto/initialize-payment-response.dto';
import { PaymentSchedulesService } from '../services/payment-schedules.service';

@ApiTags('payment-schedules')
@Controller('payment-schedules')
export class PaymentScheduleController {
  constructor(private readonly paymentSchedulesService: PaymentSchedulesService) {}

  @ApiOkResponse({ type: InitializePaymentResponseDto })
  @Post(':id/pay')
  async pay(@Param('id') id: string): Promise<InitializePaymentResponseDto> {
    return this.paymentSchedulesService.initializePayment(id);
  }
}

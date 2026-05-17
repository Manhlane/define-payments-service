import { Controller, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Payout } from '../entities/payout.entity';
import { PayoutsService } from '../services/payouts.service';

@ApiTags('deliveries')
@Controller('payment-intents')
export class DeliveryController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @ApiOkResponse({ type: Payout })
  @Post(':id/confirm')
  async confirmDelivery(@Param('id') id: string): Promise<Payout> {
    return this.payoutsService.releaseFunds(id);
  }
}

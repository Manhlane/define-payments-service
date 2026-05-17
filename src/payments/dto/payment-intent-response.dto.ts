import { ApiProperty } from '@nestjs/swagger';
import { PaymentIntentStatus } from '../enums/payment-intent-status.enum';
import { PaymentScheduleResponseDto } from './payment-schedule-response.dto';

export class PaymentIntentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  publicId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  clientName: string;

  @ApiProperty()
  clientEmail: string;

  @ApiProperty()
  clientPhone: string;

  @ApiProperty()
  serviceDescription: string;

  @ApiProperty()
  shootDate: Date;

  @ApiProperty()
  deliveryDate: Date;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: PaymentIntentStatus })
  status: PaymentIntentStatus;

  @ApiProperty()
  requireDeposit: boolean;

  @ApiProperty({ type: [PaymentScheduleResponseDto] })
  schedules: PaymentScheduleResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

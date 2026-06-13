import { ApiProperty } from '@nestjs/swagger';
import { PaymentIntentStatus } from '../enums/payment-intent-status.enum';
import { PaymentScheduleResponseDto } from './payment-schedule-response.dto';
import { DeliverableResponseDto } from './deliverable-response.dto';
import { PaymentProviderResponseDto } from './payment-provider-response.dto';

export class PaymentIntentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  publicId: string;

  @ApiProperty({ example: 'mxrzt' })
  slug: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: PaymentProviderResponseDto, nullable: true })
  provider: PaymentProviderResponseDto | null;

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

  @ApiProperty({ type: [DeliverableResponseDto] })
  deliverables: DeliverableResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

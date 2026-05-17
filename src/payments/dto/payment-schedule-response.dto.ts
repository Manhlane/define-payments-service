import { ApiProperty } from '@nestjs/swagger';
import { PaymentScheduleStatus } from '../enums/payment-schedule-status.enum';
import { PaymentScheduleType } from '../enums/payment-schedule-type.enum';

export class PaymentScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PaymentScheduleType })
  type: PaymentScheduleType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty({ enum: PaymentScheduleStatus })
  status: PaymentScheduleStatus;

  @ApiProperty({ required: false })
  paystackReference?: string | null;

  @ApiProperty({ required: false })
  paystackAuthorizationUrl?: string | null;

  @ApiProperty({ required: false })
  paidAt?: Date | null;
}

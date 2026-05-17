import { ApiProperty } from '@nestjs/swagger';

export class PaymentRequestDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'pending' })
  status!: 'pending' | 'sent';

  @ApiProperty({ example: '2026-03-22T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-22T08:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ example: 5500 })
  amount!: number;

  @ApiProperty({ example: 'ZAR' })
  currency!: string;

  @ApiProperty({ example: 'Wedding photography' })
  serviceDescription!: string;

  @ApiProperty({ required: false })
  clientEmail?: string;

  @ApiProperty({ required: false })
  clientName?: string;

  @ApiProperty({ type: [String] })
  deliverables!: string[];

  @ApiProperty({ required: false })
  shootDate?: string;

  @ApiProperty({ required: false })
  deliveryDate?: string;

  @ApiProperty({ required: false })
  paymentDueBy?: string;

  @ApiProperty({ example: 0.05 })
  platformFeeRate!: number;

  @ApiProperty({ example: 275 })
  platformFee!: number;

  @ApiProperty({ example: 5775 })
  clientPays!: number;

  @ApiProperty({ example: true })
  requireDeposit!: boolean;

  @ApiProperty({ example: 'percent', required: false })
  depositMode?: 'percent' | 'fixed';

  @ApiProperty({ example: 50, required: false })
  depositPercent?: number;

  @ApiProperty({ example: 0, required: false })
  depositFixed?: number;

  @ApiProperty({ example: 2750 })
  depositAmount!: number;

  @ApiProperty({ example: 137.5 })
  depositFee!: number;

  @ApiProperty({ example: 2887.5 })
  clientPaysNow!: number;

  @ApiProperty({ example: 2750 })
  remainderAmount!: number;

  @ApiProperty({ example: 137.5 })
  remainderFee!: number;

  @ApiProperty({ example: 2887.5 })
  clientPaysLater!: number;
}

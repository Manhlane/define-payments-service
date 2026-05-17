import { ApiProperty } from '@nestjs/swagger';

export class PaymentLinkResponseDto {
  @ApiProperty({ required: false })
  depositAuthorizationUrl?: string | null;

  @ApiProperty({ required: false })
  depositReference?: string | null;

  @ApiProperty({ required: false })
  remainderAuthorizationUrl?: string | null;

  @ApiProperty({ required: false })
  remainderReference?: string | null;
}

import { ApiProperty } from '@nestjs/swagger';

export class PaymentProviderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  businessName: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  isVerified: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class InitializePaymentResponseDto {
  @ApiProperty()
  authorizationUrl: string;

  @ApiProperty()
  reference: string;
}

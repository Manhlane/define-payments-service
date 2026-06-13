import { ApiProperty } from '@nestjs/swagger';

export class DeliverableResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  quantity: number;
}

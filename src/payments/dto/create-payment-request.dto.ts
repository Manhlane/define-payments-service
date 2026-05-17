import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DepositMode {
  Percent = 'percent',
  Fixed = 'fixed',
}

export class CreatePaymentRequestDto {
  @ApiProperty({ example: 'Wedding photography' })
  @IsString()
  @IsNotEmpty()
  serviceDescription!: string;

  @ApiProperty({ example: 5500 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'ZAR', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'client@example.com', required: false })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @ApiProperty({ example: 'Client Name', required: false })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliverables?: string[];

  @ApiProperty({ example: '2026-03-23', required: false })
  @IsOptional()
  @IsString()
  shootDate?: string;

  @ApiProperty({ example: '2026-03-28', required: false })
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @ApiProperty({ example: '2026-03-30', required: false })
  @IsOptional()
  @IsString()
  paymentDueBy?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  requireDeposit?: boolean;

  @ApiProperty({ enum: ['percent', 'fixed'], required: false })
  @IsOptional()
  @IsEnum(DepositMode)
  depositMode?: DepositMode;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  depositPercent?: number;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositFixed?: number;
}

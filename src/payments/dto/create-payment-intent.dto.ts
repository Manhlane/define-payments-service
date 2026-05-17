import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DepositType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

export class CreateDeliverableDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreatePaymentIntentDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsString()
  clientPhone: string;

  @IsString()
  serviceDescription: string;

  @IsDateString()
  shootDate: string;

  @IsDateString()
  deliveryDate: string;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsBoolean()
  requireDeposit: boolean;

  @ValidateIf((o) => o.requireDeposit)
  @IsEnum(DepositType)
  depositType?: DepositType;

  @ValidateIf((o) => o.requireDeposit)
  @IsNumber()
  @IsPositive()
  depositValue?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliverableDto)
  deliverables?: CreateDeliverableDto[];
}

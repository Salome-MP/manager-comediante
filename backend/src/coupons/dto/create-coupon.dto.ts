import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ example: 'DESCUENTO20' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  @IsString()
  @IsIn(['percentage', 'fixed'])
  discountType: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0.01)
  discountValue: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

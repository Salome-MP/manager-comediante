import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'HUMOR20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  subtotal: number;
}

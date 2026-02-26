import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShippingDto {
  @ApiProperty({ example: 'Olva Courier' })
  @IsString()
  @IsNotEmpty()
  carrier: string;

  @ApiProperty({ example: 'OLV-2024-00123' })
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;
}

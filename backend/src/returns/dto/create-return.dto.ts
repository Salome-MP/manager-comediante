import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReturnDto {
  @ApiProperty({ example: 'uuid-order-id' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'Producto defectuoso' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

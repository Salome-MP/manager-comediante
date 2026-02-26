import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  shippingName: string;

  @ApiProperty({ example: 'Av. Larco 1234, Miraflores' })
  @IsString()
  shippingAddress: string;

  @ApiProperty({ example: 'Lima' })
  @IsString()
  shippingCity: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsOptional()
  @IsString()
  shippingState?: string;

  @ApiPropertyOptional({ example: '15074' })
  @IsOptional()
  @IsString()
  shippingZip?: string;

  @ApiPropertyOptional({ example: '+51 999 888 777' })
  @IsOptional()
  @IsString()
  shippingPhone?: string;

  @ApiPropertyOptional({ enum: InvoiceType, example: 'BOLETA' })
  @IsOptional()
  @IsEnum(InvoiceType)
  invoiceType?: InvoiceType;

  @ApiPropertyOptional({ example: '20123456789', description: 'RUC para factura' })
  @IsOptional()
  @IsString()
  ruc?: string;

  @ApiPropertyOptional({ description: 'ID del cupón de descuento' })
  @IsOptional()
  @IsString()
  couponId?: string;
}

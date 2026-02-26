import { IsString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignProductDto {
  @ApiProperty({ example: 'uuid-del-artista' })
  @IsString()
  artistId: string;

  @ApiProperty({ example: 'uuid-del-producto' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 79.9, description: 'Precio de venta del artista' })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Porcentaje de comisión del artista (default 50%)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  artistCommission?: number;

  @ApiProperty({ example: 100, description: 'Stock disponible' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    example: ['https://res.cloudinary.com/custom1.jpg'],
    description: 'Imágenes personalizadas del artista',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customImages?: string[];
}

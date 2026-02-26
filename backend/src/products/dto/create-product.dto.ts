import { IsString, IsOptional, IsNumber, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductVariantDto {
  @ApiProperty({ example: 'Talla', description: 'Nombre de la variante' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['S', 'M', 'L', 'XL'], description: 'Opciones disponibles' })
  @IsArray()
  @IsString({ each: true })
  options: string[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'Polo Clásico Comediante' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Polo de algodón 100% con diseño exclusivo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-de-categoria' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 25.0, description: 'Costo de fabricación' })
  @IsNumber()
  @Min(0)
  manufacturingCost: number;

  @ApiProperty({ example: 59.9, description: 'Precio sugerido de venta' })
  @IsNumber()
  @Min(0)
  suggestedPrice: number;

  @ApiPropertyOptional({
    example: ['https://res.cloudinary.com/img1.jpg'],
    description: 'URLs de imágenes del producto',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    example: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }],
    description: 'Variantes del producto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

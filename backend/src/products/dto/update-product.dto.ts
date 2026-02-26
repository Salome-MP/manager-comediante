import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantDto } from './create-product.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Polo Clásico Comediante' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Polo de algodón 100% con diseño exclusivo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-de-categoria' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 25.0, description: 'Costo de fabricación' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  manufacturingCost?: number;

  @ApiPropertyOptional({ example: 59.9, description: 'Precio sugerido de venta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedPrice?: number;

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

  @ApiPropertyOptional({ example: true, description: 'Activar/desactivar producto' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

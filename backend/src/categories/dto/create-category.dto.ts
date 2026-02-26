import { IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class VariantTemplateDto {
  @ApiProperty({ example: 'Talla' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['S', 'M', 'L', 'XL'] })
  @IsArray()
  @IsString({ each: true })
  options: string[];
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Camisetas' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 0, description: 'Orden de visualizacion' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'ID de la categoria padre (null para categoria raiz)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Plantillas de variantes por defecto para productos de esta categoria',
    example: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantTemplateDto)
  variantTemplates?: VariantTemplateDto[];
}

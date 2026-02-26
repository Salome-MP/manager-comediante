import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomizationType } from '@prisma/client';

export class CartItemCustomizationDto {
  @ApiProperty({
    enum: [
      'AUTOGRAPH',
      'HANDWRITTEN_LETTER',
      'VIDEO_GREETING',
      'VIDEO_CALL',
      'PRODUCT_PERSONALIZATION',
    ],
    example: 'AUTOGRAPH',
  })
  @IsEnum(CustomizationType)
  type: CustomizationType;

  @ApiProperty({ example: 25.0, description: 'Precio de la personalización' })
  @IsNumber()
  @Min(0)
  price: number;
}

export class AddToCartDto {
  @ApiProperty({
    example: 'uuid-artist-product-id',
    description: 'ID del producto del artista',
  })
  @IsString()
  artistProductId: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;

  @ApiPropertyOptional({
    example: { Talla: 'M', Color: 'Negro' },
    description: 'Selección de variantes del producto',
  })
  @IsOptional()
  @IsObject()
  variantSelection?: Record<string, string>;

  @ApiPropertyOptional({
    example: 'Para mi amigo Juan',
    description: 'Personalización del producto',
  })
  @IsOptional()
  @IsString()
  personalization?: string;

  @ApiPropertyOptional({
    type: [CartItemCustomizationDto],
    description: 'Personalizaciones adicionales del artista',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemCustomizationDto)
  customizations?: CartItemCustomizationDto[];
}

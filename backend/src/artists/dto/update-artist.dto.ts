import { IsString, IsOptional, IsNumber, IsBoolean, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArtistDto {
  @ApiPropertyOptional({
    example: { instagram: '@jorgeluna', tiktok: '@jorgeluna', youtube: 'https://youtube.com/@jorgeluna' },
    description: 'Redes sociales del artista',
  })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
  @ApiPropertyOptional({ example: 'Jorge Luna' })
  @IsOptional()
  @IsString()
  stageName?: string;

  @ApiPropertyOptional({ example: 'El humor que necesitas' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Comediante peruano...' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerImage?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;
}

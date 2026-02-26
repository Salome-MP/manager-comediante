import { IsString, IsOptional, IsNumber, IsEmail, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArtistDto {
  @ApiProperty({ example: 'jorge@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jorge' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Luna' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Jorge Luna' })
  @IsString()
  stageName: string;

  @ApiPropertyOptional({ example: 'El humor que necesitas' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Comediante peruano...' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({ example: 50, description: 'Porcentaje de comisión del margen' })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;
}

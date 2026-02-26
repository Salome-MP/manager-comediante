import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateShowDto {
  @ApiProperty({ example: 'uuid-del-artista' })
  @IsString()
  artistId: string;

  @ApiProperty({ example: 'Show de Comedia en Vivo' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Una noche de risas con los mejores comediantes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Teatro Municipal' })
  @IsString()
  venue: string;

  @ApiPropertyOptional({ example: 'Av. Principal 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: '2026-04-15T20:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiPropertyOptional({ example: '2026-04-15T23:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/show.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 50.0, description: 'Precio del ticket' })
  @IsOptional()
  @IsNumber()
  ticketPrice?: number;

  @ApiPropertyOptional({ example: 200, description: 'Capacidad total del evento' })
  @IsOptional()
  @IsNumber()
  totalCapacity?: number;

  @ApiPropertyOptional({ example: 10, description: 'Porcentaje que cobra la plataforma por entrada (default 10%)' })
  @IsOptional()
  @IsNumber()
  platformFee?: number;

  @ApiPropertyOptional({ example: true, description: 'Habilitar venta de tickets', default: true })
  @IsOptional()
  @IsBoolean()
  ticketsEnabled?: boolean = true;

  @ApiPropertyOptional({ example: '2026-04-10T12:00:00.000Z', description: 'Fecha de publicacion programada' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishAt?: Date;
}

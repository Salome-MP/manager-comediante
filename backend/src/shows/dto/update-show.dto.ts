import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ShowStatus } from '@prisma/client';

export class UpdateShowDto {
  @ApiPropertyOptional({ example: 'uuid-del-artista' })
  @IsOptional()
  @IsString()
  artistId?: string;

  @ApiPropertyOptional({ example: 'Show de Comedia Actualizado' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Descripcion actualizada del show' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Teatro Nacional' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ example: 'Av. Secundaria 456' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Arequipa' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '2026-05-20T20:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ example: '2026-05-20T23:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/show-updated.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 75.0, description: 'Precio del ticket' })
  @IsOptional()
  @IsNumber()
  ticketPrice?: number;

  @ApiPropertyOptional({ example: 300, description: 'Capacidad total del evento' })
  @IsOptional()
  @IsNumber()
  totalCapacity?: number;

  @ApiPropertyOptional({ example: true, description: 'Habilitar venta de tickets' })
  @IsOptional()
  @IsBoolean()
  ticketsEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'], description: 'Estado del show' })
  @IsOptional()
  @IsEnum(ShowStatus)
  status?: ShowStatus;

  @ApiPropertyOptional({ example: '2026-04-10T12:00:00.000Z', description: 'Fecha de publicacion programada' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishAt?: Date;
}

import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'juan@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: false, description: 'Registrarse como artista' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  registerAsArtist?: boolean;

  @ApiPropertyOptional({ example: 'El Comediante', description: 'Nombre artístico (requerido si registerAsArtist=true)' })
  @ValidateIf((o) => o.registerAsArtist === true)
  @IsString()
  stageName?: string;

  @ApiPropertyOptional({ example: 'El humor que necesitas' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Comediante con 10 años de experiencia...' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({ example: 'JORG1234', description: 'Código de referido' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

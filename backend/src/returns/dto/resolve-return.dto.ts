import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReturnRequestStatus } from '@prisma/client';

export class ResolveReturnDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum({ APPROVED: 'APPROVED', REJECTED: 'REJECTED' })
  status: ReturnRequestStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiProperty({ required: false, description: 'Si se aprueba y se quiere reembolsar' })
  @IsOptional()
  @IsBoolean()
  refundOrder?: boolean;
}

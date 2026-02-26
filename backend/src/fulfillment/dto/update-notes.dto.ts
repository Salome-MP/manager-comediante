import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotesDto {
  @ApiProperty({ example: 'Cliente solicito empacar con cuidado' })
  @IsString()
  fulfillmentNotes: string;
}

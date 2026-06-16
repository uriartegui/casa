import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHouseTaskDto {
  @ApiProperty({ example: 'Trocar filtro do bebedouro' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Manutencao' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}

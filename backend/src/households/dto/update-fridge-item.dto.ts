import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFridgeItemDto {
  @ApiPropertyOptional({ example: 'Leite' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 'L' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ example: 'Laticínios' })
  @IsOptional()
  @IsString()
  category?: string;
}

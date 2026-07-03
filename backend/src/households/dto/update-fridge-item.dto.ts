import { IsString, IsOptional, IsNumber, IsDateString, IsUUID } from 'class-validator';
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
  expirationDate?: string | null;

  @ApiPropertyOptional({ example: 'Laticínios' })
  @IsOptional()
  @IsString()
  category?: string | null;

  @ApiPropertyOptional({ example: '4e9a9875-bf51-4e4b-8849-91f3a0bbad91' })
  @IsOptional()
  @IsUUID()
  storageId?: string;
}

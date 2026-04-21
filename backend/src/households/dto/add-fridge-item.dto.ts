import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddFridgeItemDto {
  @ApiProperty({ example: 'Leite' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 'L' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '2026-04-25' })
  @IsOptional()
  @IsDateString()
  expirationDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageId?: string;

  @ApiPropertyOptional({ example: 'Laticínios' })
  @IsOptional()
  @IsString()
  category?: string;
}

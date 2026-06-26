import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ToggleShoppingItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  urgent?: boolean;

  @ApiPropertyOptional({ example: 'Arroz' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 'un' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'Mercearia' })
  @IsOptional()
  @IsString()
  category?: string | null;
}

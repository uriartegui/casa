import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddListItemDto {
  @ApiProperty({ example: 'Alface' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 'un' })
  @IsOptional()
  @IsString()
  unit?: string;
}

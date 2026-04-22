import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShoppingListDto {
  @ApiProperty({ example: 'Mercado Semanal' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Carrefour' })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiPropertyOptional({ example: 'Hortifruti' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  urgent?: boolean;
}

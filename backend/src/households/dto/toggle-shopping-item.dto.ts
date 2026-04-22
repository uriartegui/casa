import { IsBoolean, IsOptional } from 'class-validator';
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
}

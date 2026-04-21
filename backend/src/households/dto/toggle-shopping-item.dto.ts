import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleShoppingItemDto {
  @ApiProperty()
  @IsBoolean()
  checked: boolean;
}

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStorageDto {
  @ApiProperty({ example: 'Freezer' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '❄️' })
  @IsOptional()
  @IsString()
  emoji?: string;
}

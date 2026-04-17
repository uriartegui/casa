import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Casa da Cecília' })
  @IsString()
  @MinLength(2)
  name: string;
}

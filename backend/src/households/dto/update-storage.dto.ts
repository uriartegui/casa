import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateStorageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  emoji?: string;
}

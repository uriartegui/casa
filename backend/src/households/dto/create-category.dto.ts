import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label: string;

  @IsOptional()
  @IsString()
  emoji?: string;
}

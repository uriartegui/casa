import { IsString } from 'class-validator';

export class CreateTaskCategoryDto {
  @IsString()
  name: string;
}

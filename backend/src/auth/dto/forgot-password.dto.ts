import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

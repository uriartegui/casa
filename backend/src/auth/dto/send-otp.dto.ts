import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: ['register', 'reset_password'] })
  @IsIn(['register', 'reset_password'])
  type: 'register' | 'reset_password';
}

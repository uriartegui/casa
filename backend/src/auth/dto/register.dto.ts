import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'guilherme@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Guilherme' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;
}

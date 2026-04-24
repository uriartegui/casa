import { IsString } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  pushToken: string;
}

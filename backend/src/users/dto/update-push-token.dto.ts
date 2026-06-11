import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  pushToken: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class RemovePushTokenDto {
  @IsOptional()
  @IsString()
  pushToken?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

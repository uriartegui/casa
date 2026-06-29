import { IsArray, IsBoolean, IsIn, IsOptional } from 'class-validator';

export type TestAlertKind = 'stock' | 'shopping' | 'task' | 'push';

export class CreateTestAlertsDto {
  @IsOptional()
  @IsArray()
  @IsIn(['stock', 'shopping', 'task', 'push'], { each: true })
  kinds?: TestAlertKind[];

  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;
}

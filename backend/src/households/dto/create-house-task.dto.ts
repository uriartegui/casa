import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHouseTaskDto {
  @ApiProperty({ example: 'Trocar filtro do bebedouro' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Manutenção' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Usar produto adequado no box.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: ['unassigned', 'all', 'user'] })
  @IsOptional()
  @IsIn(['unassigned', 'all', 'user'])
  assignmentType?: 'unassigned' | 'all' | 'user';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;

  @ApiPropertyOptional({ description: 'Lista de compras vinculada a esta tarefa' })
  @IsOptional()
  @IsUUID()
  shoppingListId?: string | null;

  @ApiPropertyOptional({ enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'] })
  @IsOptional()
  @IsIn(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'])
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  recurrenceIntervalDays?: number | null;

  @ApiPropertyOptional({ enum: ['none', 'due', 'one_hour_before', 'one_day_before'] })
  @IsOptional()
  @IsIn(['none', 'due', 'one_hour_before', 'one_day_before'])
  reminder?: 'none' | 'due' | 'one_hour_before' | 'one_day_before';
}

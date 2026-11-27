import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum.js';

export class UpdateTaskStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la tarea',
    enum: TaskStatus,
    example: TaskStatus.COMPLETED,
  })
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
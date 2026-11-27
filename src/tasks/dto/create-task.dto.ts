import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsDateString,
  IsUUID,
  ValidateIf,
  Matches,
} from 'class-validator';

import { TaskStatus } from '../enums/task-status.enum.js';
import { TaskPriority } from '../enums/task-priority.enum.js';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Título de la tarea',
    example: 'Crear módulo de autenticación',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    description: 'Descripción de la tarea',
    example: 'Implementar autenticación mediante JWT',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Estado de la tarea',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Prioridad de la tarea',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Fecha límite de la tarea',
    example: '2026-12-15',
    format: 'date',
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate!: string;

  @ApiProperty({
    description: 'ID del proyecto asociado',
    example: '27807633-7519-49a0-90df-21dac019a641',
    format: 'uuid',
  })
  @IsUUID()
  projectId!: string;
}
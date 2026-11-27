import { ApiProperty } from '@nestjs/swagger';

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Sistema de inventario',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    description: 'Descripción del proyecto',
    example: 'Desarrollo de una API REST para inventarios',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Fecha de inicio del proyecto',
    example: '2026-11-25',
    format: 'date',
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @ApiProperty({
    description: 'Fecha de finalización del proyecto',
    example: '2026-12-30',
    format: 'date',
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;
}
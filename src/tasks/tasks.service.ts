import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , FindOptionsWhere, LessThan, Not} from 'typeorm';


import { FilterTaskDto } from './dto/filter-task.dto.js';
import { Task } from './entities/task.entity.js';
import { Project } from '../projects/entities/project.entity.js';

import { TaskStatus } from './enums/task-status.enum.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  private async validateProject(projectId: string): Promise<void> {
    const exists = await this.projectRepository.existsBy({
      id: projectId,
    });

    if (!exists) {
      throw new NotFoundException(
        `El proyecto con ID ${projectId} no existe`,
      );
    }
  }

  async findOverdue(): Promise<Task[]> {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return await this.taskRepository.find({
    where: {
      dueDate: LessThan(today),
      status: Not(TaskStatus.COMPLETED),
    },
    relations: {
      project: true,
    },
  });
}

  async create(dto: CreateTaskDto): Promise<Task> {
    await this.validateProject(dto.projectId);

    const task = this.taskRepository.create(dto);

    return await this.taskRepository.save(task);
  }

  async findAll(
  filters: FilterTaskDto,
): Promise<Task[]> {
  const where: FindOptionsWhere<Task> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  return await this.taskRepository.find({
    where,
    relations: {
      project: true,
    },
  });
}

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException(
        `La tarea con ID ${id} no existe`,
      );
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findOne(id);

    if (dto.projectId !== undefined) {
      await this.validateProject(dto.projectId);
    }

    await this.taskRepository.update(id, dto);

    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const task = await this.findOne(id);

    task.status = dto.status;

    return await this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);

    await this.taskRepository.remove(task);
  }
}
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, DataSource } from 'typeorm';

import { TaskStatus } from '../tasks/enums/task-status.enum.js';
import { Task } from '../tasks/entities/task.entity.js';
import { Project } from './entities/project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    private readonly dataSource: DataSource,
  ) {}

  async findTasks(id: string): Promise<Task[]> {
    await this.findOne(id);

    return await this.taskRepository.find({
      where: {
        projectId: id,
      },
    });
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    if (dto.endDate && dto.startDate && dto.endDate < dto.startDate) {
      throw new BadRequestException(
        'La fecha de finalización no puede ser anterior a la fecha de inicio',
      );
    }

    const project = this.projectRepository.create(dto);

    return await this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return await this.projectRepository.find();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id} no existe`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    const startDate = dto.startDate ?? project.startDate;
    const endDate = dto.endDate ?? project.endDate;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de finalización no puede ser anterior a la fecha de inicio',
      );
    }

    this.projectRepository.merge(project, dto);

    return await this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const project = await manager.findOne(Project, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project) {
        throw new NotFoundException(`El proyecto con ID ${id} no existe`);
      }

      await manager.find(Task, {
        where: { projectId: id },
        lock: { mode: 'pessimistic_write' },
      });

      const unfinishedTasks = await manager.count(Task, {
        where: {
          projectId: id,
          status: Not(TaskStatus.COMPLETED),
        },
      });

      if (unfinishedTasks > 0) {
        throw new ConflictException(
          'No se puede eliminar un proyecto con tareas sin completar',
        );
      }

      await manager.delete(Task, {
        projectId: id,
      });

      await manager.delete(Project, {
        id,
      });
    });
  }

  async getProgress(id: string) {
    const project = await this.findOne(id);

    const totalTasks = await this.taskRepository.count({
      where: {
        projectId: id,
      },
    });

    const completedTasks = await this.taskRepository.count({
      where: {
        projectId: id,
        status: TaskStatus.COMPLETED,
      },
    });

    const progress =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return {
      projectId: project.id,
      projectName: project.name,
      totalTasks,
      completedTasks,
      remainingTasks: totalTasks - completedTasks,
      progress,
    };
  }
}
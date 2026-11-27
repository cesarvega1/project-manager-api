import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { NotFoundException } from '@nestjs/common';
import { LessThan, Not } from 'typeorm';

import { TasksService } from './tasks.service.js';
import { Task } from './entities/task.entity.js';
import { Project } from '../projects/entities/project.entity.js';

import { TaskStatus } from './enums/task-status.enum.js';
import { TaskPriority } from './enums/task-priority.enum.js';

describe('TasksService', () => {
  let service: TasksService;

  const taskRepository = {
    create: jest.fn<(...args: any[]) => any>(),
    save: jest.fn<(...args: any[]) => Promise<any>>(),
    find: jest.fn<(...args: any[]) => Promise<any>>(),
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    update: jest.fn<(...args: any[]) => Promise<any>>(),
    remove: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const projectRepository = {
    existsBy: jest.fn<(...args: any[]) => Promise<boolean>>(),
  };

  const taskDto = {
    title: 'Crear API REST',
    description: 'Desarrollar backend con NestJS',
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    dueDate: '2026-12-15',
    projectId: 'project-123',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: getRepositoryToken(Task),
            useValue: taskRepository,
          },
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepository,
          },
        ],
      }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear una tarea correctamente', async () => {
      const task = {
        id: 'task-123',
        ...taskDto,
      };

      projectRepository.existsBy.mockResolvedValue(true);

      taskRepository.create.mockReturnValue(taskDto);
      taskRepository.save.mockResolvedValue(task);

      const result = await service.create(taskDto);

      expect(result).toEqual(task);

      expect(projectRepository.existsBy)
        .toHaveBeenCalledWith({
          id: taskDto.projectId,
        });

      expect(taskRepository.create)
        .toHaveBeenCalledWith(taskDto);

      expect(taskRepository.save)
        .toHaveBeenCalledWith(taskDto);
    });

    it('debería rechazar un proyecto inexistente', async () => {
      projectRepository.existsBy.mockResolvedValue(false);

      await expect(
        service.create(taskDto),
      ).rejects.toThrow(NotFoundException);

      expect(taskRepository.create)
        .not.toHaveBeenCalled();

      expect(taskRepository.save)
        .not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las tareas sin filtros', async () => {
      const tasks = [
        { id: 'task-1', ...taskDto },
        { id: 'task-2', ...taskDto },
      ];

      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findAll({});

      expect(result).toEqual(tasks);

      expect(taskRepository.find)
        .toHaveBeenCalledWith({
          where: {},
          relations: {
            project: true,
          },
        });
    });

    it('debería filtrar por estado', async () => {
      taskRepository.find.mockResolvedValue([]);

      await service.findAll({
        status: TaskStatus.PENDING,
      });

      expect(taskRepository.find)
        .toHaveBeenCalledWith({
          where: {
            status: TaskStatus.PENDING,
          },
          relations: {
            project: true,
          },
        });
    });

    it('debería filtrar por prioridad', async () => {
      taskRepository.find.mockResolvedValue([]);

      await service.findAll({
        priority: TaskPriority.HIGH,
      });

      expect(taskRepository.find)
        .toHaveBeenCalledWith({
          where: {
            priority: TaskPriority.HIGH,
          },
          relations: {
            project: true,
          },
        });
    });

    it('debería combinar estado y prioridad', async () => {
      taskRepository.find.mockResolvedValue([]);

      await service.findAll({
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
      });

      expect(taskRepository.find)
        .toHaveBeenCalledWith({
          where: {
            status: TaskStatus.PENDING,
            priority: TaskPriority.HIGH,
          },
          relations: {
            project: true,
          },
        });
    });
  });

  describe('findOne', () => {
    it('debería retornar una tarea existente', async () => {
      const task = {
        id: 'task-123',
        ...taskDto,
      };

      taskRepository.findOne.mockResolvedValue(task);

      const result = await service.findOne('task-123');

      expect(result).toEqual(task);

      expect(taskRepository.findOne)
        .toHaveBeenCalledWith({
          where: {
            id: 'task-123',
          },
          relations: {
            project: true,
          },
        });
    });

    it('debería lanzar NotFoundException', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('task-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debería actualizar una tarea correctamente', async () => {
      const task = {
        id: 'task-123',
        ...taskDto,
      };

      const dto = {
        title: 'Tarea actualizada',
      };

      const updatedTask = {
        ...task,
        ...dto,
      };

      taskRepository.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(updatedTask);

      taskRepository.update.mockResolvedValue({
        affected: 1,
      });

      const result = await service.update(task.id, dto);

      expect(result).toEqual(updatedTask);

      expect(taskRepository.update)
        .toHaveBeenCalledWith(task.id, dto);

      expect(projectRepository.existsBy)
        .not.toHaveBeenCalled();
    });

    it('debería permitir cambiar la tarea de proyecto', async () => {
      const task = {
        id: 'task-123',
        ...taskDto,
      };

      const dto = {
        projectId: 'project-456',
      };

      const updatedTask = {
        ...task,
        ...dto,
      };

      taskRepository.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(updatedTask);

      projectRepository.existsBy.mockResolvedValue(true);

      taskRepository.update.mockResolvedValue({
        affected: 1,
      });

      const result = await service.update(task.id, dto);

      expect(result.projectId).toBe('project-456');

      expect(projectRepository.existsBy)
        .toHaveBeenCalledWith({
          id: 'project-456',
        });

      expect(taskRepository.update)
        .toHaveBeenCalledWith(task.id, dto);
    });

    it('debería rechazar un proyecto de destino inexistente', async () => {
      taskRepository.findOne.mockResolvedValue({
        id: 'task-123',
        ...taskDto,
      });

      projectRepository.existsBy.mockResolvedValue(false);

      await expect(
        service.update('task-123', {
          projectId: 'project-456',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(taskRepository.update)
        .not.toHaveBeenCalled();
    });

    it('debería rechazar una tarea inexistente', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('task-123', {
          title: 'Nuevo título',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(taskRepository.update)
        .not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('debería cambiar el estado de una tarea', async () => {
      const task = {
        id: 'task-123',
        ...taskDto,
      };

      const updatedTask = {
        ...task,
        status: TaskStatus.COMPLETED,
      };

      taskRepository.findOne.mockResolvedValue(task);
      taskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.updateStatus(
        'task-123',
        {
          status: TaskStatus.COMPLETED,
        },
      );

      expect(result.status).toBe(TaskStatus.COMPLETED);

      expect(taskRepository.save)
        .toHaveBeenCalledWith(updatedTask);
    });

    it('debería rechazar una tarea inexistente', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('task-123', {
          status: TaskStatus.COMPLETED,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(taskRepository.save)
        .not.toHaveBeenCalled();
    });
  });

  describe('findOverdue', () => {
    it('debería consultar las tareas vencidas sin completar', async () => {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const tasks = [
        {
          id: 'task-123',
          ...taskDto,
          dueDate: '2020-01-01',
        },
      ];

      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findOverdue();

      expect(result).toEqual(tasks);

      expect(taskRepository.find)
        .toHaveBeenCalledWith({
          where: {
            dueDate: LessThan(today),
            status: Not(TaskStatus.COMPLETED),
          },
          relations: {
            project: true,
          },
        });
    });

    it('debería retornar un arreglo vacío si no hay tareas vencidas', async () => {
      taskRepository.find.mockResolvedValue([]);

      const result = await service.findOverdue();

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('debería eliminar una tarea correctamente', async () => {
      const task = {
        id: 'task-123',
        ...taskDto,
      };

      taskRepository.findOne.mockResolvedValue(task);
      taskRepository.remove.mockResolvedValue(task);

      await service.remove('task-123');

      expect(taskRepository.remove)
        .toHaveBeenCalledWith(task);

      expect(taskRepository.remove)
        .toHaveBeenCalledTimes(1);
    });

    it('debería rechazar una tarea inexistente', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('task-123'),
      ).rejects.toThrow(NotFoundException);

      expect(taskRepository.remove)
        .not.toHaveBeenCalled();
    });
  });
});
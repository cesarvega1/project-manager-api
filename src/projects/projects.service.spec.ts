import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { ProjectsService } from './projects.service.js';
import { Project } from './entities/project.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { TaskStatus } from '../tasks/enums/task-status.enum.js';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const projectRepository = {
    create: jest.fn<(...args: any[]) => any>(),
    save: jest.fn<(...args: any[]) => Promise<any>>(),
    find: jest.fn<(...args: any[]) => Promise<any>>(),
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    merge: jest.fn<(...args: any[]) => any>(),
  };

  const taskRepository = {
    find: jest.fn<(...args: any[]) => Promise<any>>(),
    count: jest.fn<(...args: any[]) => Promise<number>>(),
  };

  const manager = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    find: jest.fn<(...args: any[]) => Promise<any>>(),
    count: jest.fn<(...args: any[]) => Promise<number>>(),
    delete: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const dataSource = {
    transaction: jest.fn<
      (
        callback: (m: typeof manager) => Promise<void>,
      ) => Promise<void>
    >(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProjectsService,
          {
            provide: getRepositoryToken(Project),
            useValue: projectRepository,
          },
          {
            provide: getRepositoryToken(Task),
            useValue: taskRepository,
          },
          {
            provide: DataSource,
            useValue: dataSource,
          },
        ],
      }).compile();

    service = module.get<ProjectsService>(
      ProjectsService,
    );
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      name: 'Proyecto de prueba',
      description: 'Prueba unitaria con Jest',
      startDate: '2026-11-26',
      endDate: '2026-12-30',
    };

    it('debería crear un proyecto correctamente', async () => {
      const project = {
        id: 'project-123',
        ...dto,
      };

      projectRepository.create.mockReturnValue(dto);
      projectRepository.save.mockResolvedValue(project);

      const result = await service.create(dto);

      expect(result).toEqual(project);

      expect(projectRepository.create)
        .toHaveBeenCalledWith(dto);

      expect(projectRepository.save)
        .toHaveBeenCalledWith(dto);
    });

    it('debería rechazar fechas incoherentes', async () => {
      const invalidDto = {
        ...dto,
        endDate: '2026-10-01',
      };

      await expect(
        service.create(invalidDto),
      ).rejects.toThrow(BadRequestException);

      expect(projectRepository.save)
        .not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los proyectos', async () => {
      const projects = [
        { id: '1', name: 'Proyecto 1' },
        { id: '2', name: 'Proyecto 2' },
      ];

      projectRepository.find.mockResolvedValue(projects);

      const result = await service.findAll();

      expect(result).toEqual(projects);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('debería retornar un proyecto existente', async () => {
      const project = {
        id: 'project-123',
        name: 'Proyecto de prueba',
      };

      projectRepository.findOne.mockResolvedValue(project);

      const result = await service.findOne(project.id);

      expect(result).toEqual(project);
    });

    it('debería lanzar NotFoundException', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('inexistente'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debería actualizar un proyecto correctamente', async () => {
      const project = {
        id: 'project-123',
        name: 'Nombre original',
        startDate: '2026-11-26',
        endDate: '2026-12-30',
      };

      const dto = {
        name: 'Nombre actualizado',
      };

      const updatedProject = {
        ...project,
        ...dto,
      };

      projectRepository.findOne.mockResolvedValue(project);

      projectRepository.merge.mockImplementation(() =>
        Object.assign(project, dto),
      );

      projectRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(project.id, dto);

      expect(result).toEqual(updatedProject);

      expect(projectRepository.merge)
        .toHaveBeenCalledWith(project, dto);

      expect(projectRepository.save)
        .toHaveBeenCalledWith(updatedProject);
    });

    it('debería rechazar fechas incoherentes', async () => {
      projectRepository.findOne.mockResolvedValue({
        id: 'project-123',
        startDate: '2026-11-26',
        endDate: '2026-12-30',
      });

      await expect(
        service.update('project-123', {
          endDate: '2026-10-01',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(projectRepository.save)
        .not.toHaveBeenCalled();
    });

    it('debería rechazar un proyecto inexistente', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('project-123', {
          name: 'Nuevo nombre',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTasks', () => {
    it('debería retornar las tareas de un proyecto', async () => {
      projectRepository.findOne.mockResolvedValue({
        id: 'project-123',
      });

      const tasks = [
        {
          id: 'task-1',
          title: 'Crear API',
          projectId: 'project-123',
        },
        {
          id: 'task-2',
          title: 'Documentar API',
          projectId: 'project-123',
        },
      ];

      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findTasks('project-123');

      expect(result).toEqual(tasks);
      expect(result).toHaveLength(2);

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: {
          projectId: 'project-123',
        },
      });
    });

    it('debería retornar un arreglo vacío si no tiene tareas', async () => {
      projectRepository.findOne.mockResolvedValue({
        id: 'project-123',
      });

      taskRepository.find.mockResolvedValue([]);

      const result = await service.findTasks('project-123');

      expect(result).toEqual([]);
    });

    it('debería rechazar un proyecto inexistente', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findTasks('project-123'),
      ).rejects.toThrow(NotFoundException);

      expect(taskRepository.find)
        .not.toHaveBeenCalled();
    });
  });

  describe('getProgress', () => {
    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue({
        id: 'project-123',
        name: 'Proyecto de prueba',
      });
    });

    it('debería retornar un avance del 60%', async () => {
      taskRepository.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      const result = await service.getProgress('project-123');

      expect(result).toEqual({
        projectId: 'project-123',
        projectName: 'Proyecto de prueba',
        totalTasks: 5,
        completedTasks: 3,
        remainingTasks: 2,
        progress: 60,
      });

      expect(taskRepository.count)
        .toHaveBeenNthCalledWith(1, {
          where: {
            projectId: 'project-123',
          },
        });

      expect(taskRepository.count)
        .toHaveBeenNthCalledWith(2, {
          where: {
            projectId: 'project-123',
            status: TaskStatus.COMPLETED,
          },
        });
    });

    it('debería retornar 0% cuando no tiene tareas', async () => {
      taskRepository.count.mockResolvedValue(0);

      const result = await service.getProgress('project-123');

      expect(result.progress).toBe(0);
    });

    it('debería retornar 100% cuando todas están completadas', async () => {
      taskRepository.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(4);

      const result = await service.getProgress('project-123');

      expect(result.progress).toBe(100);
      expect(result.remainingTasks).toBe(0);
    });

    it('debería rechazar un proyecto inexistente', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getProgress('project-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      dataSource.transaction.mockImplementation(
        async (callback) => callback(manager),
      );

      manager.findOne.mockResolvedValue({
        id: 'project-123',
      });

      manager.find.mockResolvedValue([]);
      manager.delete.mockResolvedValue({
        affected: 1,
      });
    });

    it('debería eliminar un proyecto sin tareas pendientes', async () => {
      manager.count.mockResolvedValue(0);

      await service.remove('project-123');

      expect(dataSource.transaction)
        .toHaveBeenCalledTimes(1);

      expect(manager.delete)
        .toHaveBeenNthCalledWith(1, Task, {
          projectId: 'project-123',
        });

      expect(manager.delete)
        .toHaveBeenNthCalledWith(2, Project, {
          id: 'project-123',
        });
    });

    it('debería impedir eliminar un proyecto con tareas sin completar', async () => {
      manager.count.mockResolvedValue(2);

      await expect(
        service.remove('project-123'),
      ).rejects.toThrow(ConflictException);

      expect(manager.delete)
        .not.toHaveBeenCalled();
    });

    it('debería rechazar un proyecto inexistente', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.remove('project-123'),
      ).rejects.toThrow(NotFoundException);

      expect(manager.delete)
        .not.toHaveBeenCalled();
    });
  });
});
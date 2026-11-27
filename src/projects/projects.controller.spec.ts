import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';

import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findTasks: jest.fn(),
    getProgress: jest.fn(),
  };

  const projectDto = {
    name: 'Proyecto de prueba',
    description: 'Testing de controladores',
    startDate: '2026-11-26',
    endDate: '2026-12-30',
  };

  const project = {
    id: 'project-123',
    ...projectDto,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [ProjectsController],
        providers: [
          {
            provide: ProjectsService,
            useValue: service,
          },
        ],
      }).compile();

    controller = module.get<ProjectsController>(
      ProjectsController,
    );
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería crear un proyecto', async () => {
    service.create.mockReturnValue(
      Promise.resolve(project),
    );

    const result = await controller.create(projectDto);

    expect(result).toEqual(project);
    expect(service.create).toHaveBeenCalledWith(projectDto);
  });

  it('debería listar los proyectos', async () => {
    service.findAll.mockReturnValue(
      Promise.resolve([project]),
    );

    const result = await controller.findAll();

    expect(result).toEqual([project]);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('debería consultar un proyecto por ID', async () => {
    service.findOne.mockReturnValue(
      Promise.resolve(project),
    );

    const result = await controller.findOne(project.id);

    expect(result).toEqual(project);
    expect(service.findOne).toHaveBeenCalledWith(project.id);
  });

  it('debería actualizar un proyecto', async () => {
    const dto = {
      name: 'Proyecto actualizado',
    };

    const updatedProject = {
      ...project,
      ...dto,
    };

    service.update.mockReturnValue(
      Promise.resolve(updatedProject),
    );

    const result = await controller.update(project.id, dto);

    expect(result).toEqual(updatedProject);

    expect(service.update)
      .toHaveBeenCalledWith(project.id, dto);
  });

  it('debería eliminar un proyecto', async () => {
    service.remove.mockReturnValue(
      Promise.resolve(undefined),
    );

    await controller.remove(project.id);

    expect(service.remove)
      .toHaveBeenCalledWith(project.id);
  });

  it('debería consultar las tareas de un proyecto', async () => {
    const tasks = [
      {
        id: 'task-123',
        title: 'Crear API',
        projectId: project.id,
      },
    ];

    service.findTasks.mockReturnValue(
      Promise.resolve(tasks),
    );

    const result = await controller.findTasks(project.id);

    expect(result).toEqual(tasks);

    expect(service.findTasks)
      .toHaveBeenCalledWith(project.id);
  });

  it('debería consultar el porcentaje de avance', async () => {
    const progress = {
      projectId: project.id,
      projectName: project.name,
      totalTasks: 5,
      completedTasks: 3,
      remainingTasks: 2,
      progress: 60,
    };

    service.getProgress.mockReturnValue(
      Promise.resolve(progress),
    );

    const result = await controller.getProgress(project.id);

    expect(result).toEqual(progress);

    expect(service.getProgress)
      .toHaveBeenCalledWith(project.id);
  });
});
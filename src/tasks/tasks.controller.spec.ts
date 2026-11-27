import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';

import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

import { TaskStatus } from './enums/task-status.enum.js';
import { TaskPriority } from './enums/task-priority.enum.js';

describe('TasksController', () => {
  let controller: TasksController;

  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    findOverdue: jest.fn(),
    remove: jest.fn(),
  };

  const taskDto = {
    title: 'Crear API REST',
    description: 'Desarrollar backend',
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    dueDate: '2026-12-15',
    projectId: 'project-123',
  };

  const task = {
    id: 'task-123',
    ...taskDto,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [TasksController],
        providers: [
          {
            provide: TasksService,
            useValue: service,
          },
        ],
      }).compile();

    controller = module.get<TasksController>(
      TasksController,
    );
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería crear una tarea', async () => {
    service.create.mockReturnValue(
      Promise.resolve(task),
    );

    const result = await controller.create(taskDto);

    expect(result).toEqual(task);

    expect(service.create)
      .toHaveBeenCalledWith(taskDto);
  });

  it('debería listar las tareas', async () => {
    service.findAll.mockReturnValue(
      Promise.resolve([task]),
    );

    const result = await controller.findAll({});

    expect(result).toEqual([task]);

    expect(service.findAll)
      .toHaveBeenCalledWith({});
  });

  it('debería enviar correctamente los filtros', async () => {
    const filters = {
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
    };

    service.findAll.mockReturnValue(
      Promise.resolve([task]),
    );

    const result = await controller.findAll(filters);

    expect(result).toEqual([task]);

    expect(service.findAll)
      .toHaveBeenCalledWith(filters);
  });

  it('debería consultar una tarea por ID', async () => {
    service.findOne.mockReturnValue(
      Promise.resolve(task),
    );

    const result = await controller.findOne(task.id);

    expect(result).toEqual(task);

    expect(service.findOne)
      .toHaveBeenCalledWith(task.id);
  });

  it('debería actualizar una tarea', async () => {
    const dto = {
      title: 'Tarea actualizada',
    };

    const updatedTask = {
      ...task,
      ...dto,
    };

    service.update.mockReturnValue(
      Promise.resolve(updatedTask),
    );

    const result = await controller.update(task.id, dto);

    expect(result).toEqual(updatedTask);

    expect(service.update)
      .toHaveBeenCalledWith(task.id, dto);
  });

  it('debería cambiar el estado de una tarea', async () => {
    const dto = {
      status: TaskStatus.COMPLETED,
    };

    const updatedTask = {
      ...task,
      ...dto,
    };

    service.updateStatus.mockReturnValue(
      Promise.resolve(updatedTask),
    );

    const result = await controller.updateStatus(
      task.id,
      dto,
    );

    expect(result).toEqual(updatedTask);

    expect(service.updateStatus)
      .toHaveBeenCalledWith(task.id, dto);
  });

  it('debería consultar las tareas vencidas', async () => {
    service.findOverdue.mockReturnValue(
      Promise.resolve([task]),
    );

    const result = await controller.findOverdue();

    expect(result).toEqual([task]);

    expect(service.findOverdue)
      .toHaveBeenCalledTimes(1);
  });

  it('debería eliminar una tarea', async () => {
    service.remove.mockReturnValue(
      Promise.resolve(undefined),
    );

    await controller.remove(task.id);

    expect(service.remove)
      .toHaveBeenCalledWith(task.id);
  });
});
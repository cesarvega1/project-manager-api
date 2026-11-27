import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from '@jest/globals';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  setupApp,
  cleanDatabase,
} from './helpers/setup-app.js';

import { TaskStatus } from '../src/tasks/enums/task-status.enum.js';
import { TaskPriority } from '../src/tasks/enums/task-priority.enum.js';

describe('TasksController (E2E)', () => {
  let app: INestApplication;
  let projectId: string;

  beforeAll(async () => {
    app = await setupApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    const response = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Proyecto de pruebas',
        description: 'Testing de tareas',
        startDate: '2026-11-26',
        endDate: '2026-12-30',
      })
      .expect(201);

    projectId = response.body.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  function getTaskDto() {
    return {
      title: 'Desarrollar API REST',
      description: 'Implementar endpoints con NestJS',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: '2026-12-15',
      projectId,
    };
  }

  async function createTask(
    overrides: Partial<ReturnType<typeof getTaskDto>> = {},
  ) {
    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send({
        ...getTaskDto(),
        ...overrides,
      })
      .expect(201);

    return response.body;
  }

  describe('POST /tasks', () => {
    it('debería crear una tarea correctamente', async () => {
      const task = await createTask();

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Desarrollar API REST');
      expect(task.projectId).toBe(projectId);
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it('debería rechazar un título vacío', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({
          ...getTaskDto(),
          title: '',
        })
        .expect(400);
    });

    it('debería rechazar un estado inválido', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({
          ...getTaskDto(),
          status: 'invalid',
        })
        .expect(400);
    });

    it('debería rechazar una prioridad inválida', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({
          ...getTaskDto(),
          priority: 'urgent',
        })
        .expect(400);
    });

    it('debería rechazar un proyecto inexistente', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({
          ...getTaskDto(),
          projectId: '550e8400-e29b-41d4-a716-446655440000',
        })
        .expect(404);
    });
  });

  describe('Consultas de tareas', () => {
    it('GET /tasks - debería listar las tareas', async () => {
      await createTask();
      await createTask();

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('GET /tasks/:id - debería consultar una tarea', async () => {
      const task = await createTask();

      const response = await request(app.getHttpServer())
        .get(`/tasks/${task.id}`)
        .expect(200);

      expect(response.body.id).toBe(task.id);
      expect(response.body.project.id).toBe(projectId);
    });

    it('GET /tasks/:id - debería retornar 404', async () => {
      await request(app.getHttpServer())
        .get('/tasks/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
    });
  });

  describe('Filtros de tareas', () => {
    it('debería filtrar tareas por estado', async () => {
      await createTask({
        status: TaskStatus.PENDING,
      });

      await createTask({
        status: TaskStatus.COMPLETED,
      });

      const response = await request(app.getHttpServer())
        .get(`/tasks?status=${TaskStatus.PENDING}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(TaskStatus.PENDING);
    });

    it('debería filtrar tareas por prioridad', async () => {
      await createTask({
        priority: TaskPriority.HIGH,
      });

      await createTask({
        priority: TaskPriority.LOW,
      });

      const response = await request(app.getHttpServer())
        .get(`/tasks?priority=${TaskPriority.HIGH}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].priority).toBe(TaskPriority.HIGH);
    });

    it('debería combinar estado y prioridad', async () => {
      await createTask({
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
      });

      await createTask({
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
      });

      await createTask({
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
      });

      const response = await request(app.getHttpServer())
        .get(`/tasks?status=${TaskStatus.PENDING}&priority=${TaskPriority.HIGH}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(TaskStatus.PENDING);
      expect(response.body[0].priority).toBe(TaskPriority.HIGH);
    });

    it('debería rechazar un filtro inválido', async () => {
      await request(app.getHttpServer())
        .get('/tasks?status=invalid')
        .expect(400);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('debería actualizar una tarea', async () => {
      const task = await createTask();

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${task.id}`)
        .send({
          title: 'Tarea actualizada',
          priority: TaskPriority.HIGH,
        })
        .expect(200);

      expect(response.body.title).toBe('Tarea actualizada');
      expect(response.body.priority).toBe(TaskPriority.HIGH);
    });

    it('debería rechazar una tarea inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/tasks/550e8400-e29b-41d4-a716-446655440000')
        .send({
          title: 'Tarea actualizada',
        })
        .expect(404);
    });
  });

  describe('PATCH /tasks/:id/status', () => {
    it('debería cambiar el estado de una tarea', async () => {
      const task = await createTask();

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${task.id}/status`)
        .send({
          status: TaskStatus.COMPLETED,
        })
        .expect(200);

      expect(response.body.status).toBe(TaskStatus.COMPLETED);

      const savedTask = await request(app.getHttpServer())
        .get(`/tasks/${task.id}`)
        .expect(200);

      expect(savedTask.body.status).toBe(TaskStatus.COMPLETED);
    });

    it('debería rechazar un cambio de estado inválido', async () => {
      const task = await createTask();

      await request(app.getHttpServer())
        .patch(`/tasks/${task.id}/status`)
        .send({
          status: 'cancelled',
        })
        .expect(400);
    });
  });

  describe('GET /tasks/overdue', () => {
    it('debería retornar únicamente tareas vencidas sin completar', async () => {
      const pastDate = new Date();
      pastDate.setUTCDate(pastDate.getUTCDate() - 2);

      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 2);

      const yesterday = pastDate.toISOString().split('T')[0];
      const tomorrow = futureDate.toISOString().split('T')[0];

      const overdueTask = await createTask({
        status: TaskStatus.PENDING,
        dueDate: yesterday,
      });

      await createTask({
        status: TaskStatus.COMPLETED,
        dueDate: yesterday,
      });

      await createTask({
        status: TaskStatus.PENDING,
        dueDate: tomorrow,
      });

      const response = await request(app.getHttpServer())
        .get('/tasks/overdue')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(overdueTask.id);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('debería eliminar una tarea correctamente', async () => {
      const task = await createTask();

      await request(app.getHttpServer())
        .delete(`/tasks/${task.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/tasks/${task.id}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .expect(200);
    });

    it('debería rechazar la eliminación de una tarea inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/tasks/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
    });
  });
});
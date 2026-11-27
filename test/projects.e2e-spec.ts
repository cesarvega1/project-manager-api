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

describe('ProjectsController (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createProject(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Proyecto de prueba',
        description: 'Prueba E2E con Jest',
        startDate: '2026-11-26',
        endDate: '2026-12-30',
      })
      .expect(201);

    return response.body.id;
  }

  async function createTask(
    projectId: string,
    status = 'pendiente',
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send({
        title: 'Tarea de prueba',
        description: 'Prueba automatizada',
        priority: 'alto',
        status,
        dueDate: '2026-12-15',
        projectId,
      })
      .expect(201);

    return response.body.id;
  }

  it('GET /projects - debería retornar una lista vacía', async () => {
    const response = await request(app.getHttpServer())
      .get('/projects')
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('POST /projects - debería crear un proyecto', async () => {
    const response = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Proyecto de prueba',
        description: 'Prueba E2E con Jest',
        startDate: '2026-11-26',
        endDate: '2026-12-30',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('Proyecto de prueba');
  });

  it('GET /projects/:id - debería consultar un proyecto', async () => {
    const id = await createProject();

    const response = await request(app.getHttpServer())
      .get(`/projects/${id}`)
      .expect(200);

    expect(response.body.id).toBe(id);
  });

  it('GET /projects/:id - debería retornar 404', async () => {
    await request(app.getHttpServer())
      .get('/projects/550e8400-e29b-41d4-a716-446655440000')
      .expect(404);
  });

  it('GET /projects/:id - debería rechazar un UUID inválido', async () => {
    await request(app.getHttpServer())
      .get('/projects/123')
      .expect(400);
  });

  it('POST /projects - debería rechazar un nombre vacío', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: '',
        description: 'Proyecto de prueba',
        startDate: '2026-11-26',
        endDate: '2026-12-30',
      })
      .expect(400);
  });

  it('POST /projects - debería rechazar fechas incoherentes', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Proyecto de prueba',
        description: 'Validación de fechas',
        startDate: '2026-12-30',
        endDate: '2026-11-26',
      })
      .expect(400);
  });

  it('PATCH /projects/:id - debería actualizar un proyecto', async () => {
    const id = await createProject();

    const response = await request(app.getHttpServer())
      .patch(`/projects/${id}`)
      .send({
        name: 'Proyecto actualizado',
      })
      .expect(200);

    expect(response.body.name).toBe('Proyecto actualizado');
  });

  it('DELETE /projects/:id - debería eliminar un proyecto', async () => {
    const id = await createProject();

    await request(app.getHttpServer())
      .delete(`/projects/${id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/projects/${id}`)
      .expect(404);
  });

  it('DELETE /projects/:id - debería impedir eliminar un proyecto con tareas pendientes', async () => {
    const id = await createProject();

    await createTask(id, 'pendiente');

    await request(app.getHttpServer())
      .delete(`/projects/${id}`)
      .expect(409);
  });

  it('DELETE /projects/:id - debería impedir eliminar un proyecto con tareas en progreso', async () => {
    const id = await createProject();

    await createTask(id, 'en_progreso');

    await request(app.getHttpServer())
      .delete(`/projects/${id}`)
      .expect(409);
  });

  it('DELETE /projects/:id - debería eliminar un proyecto con tareas completadas', async () => {
    const id = await createProject();

    const taskId = await createTask(id, 'completada');

    await request(app.getHttpServer())
      .delete(`/projects/${id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .expect(404);
  });

  it('GET /projects/:id/progress - debería retornar 50% de avance', async () => {
    const id = await createProject();

    await createTask(id, 'completada');
    await createTask(id, 'pendiente');

    const response = await request(app.getHttpServer())
      .get(`/projects/${id}/progress`)
      .expect(200);

    expect(response.body.totalTasks).toBe(2);
    expect(response.body.completedTasks).toBe(1);
    expect(response.body.remainingTasks).toBe(1);
    expect(response.body.progress).toBe(50);
  });

  it('GET /projects/:id/progress - debería retornar 0% sin tareas', async () => {
    const id = await createProject();

    const response = await request(app.getHttpServer())
      .get(`/projects/${id}/progress`)
      .expect(200);

    expect(response.body.progress).toBe(0);
  });

  it('GET /projects/:id/progress - debería retornar 100% de avance', async () => {
    const id = await createProject();

    await createTask(id, 'completada');
    await createTask(id, 'completada');

    const response = await request(app.getHttpServer())
      .get(`/projects/${id}/progress`)
      .expect(200);

    expect(response.body.progress).toBe(100);
  });

  it('GET /projects/:id/tasks - debería retornar las tareas asociadas', async () => {
    const id = await createProject();

    await createTask(id);
    await createTask(id);

    const response = await request(app.getHttpServer())
      .get(`/projects/${id}/tasks`)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].projectId).toBe(id);
    expect(response.body[1].projectId).toBe(id);
  });
});
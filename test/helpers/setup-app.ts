import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';

export async function setupApp(): Promise<INestApplication> {
  const expectedEnv = {
    NODE_ENV: 'test',
    DB_NAME: 'rest_api_test',
    DB_PORT: '5435',
    DB_HOST: '127.0.0.1',
  };

  for (const [key, expected] of Object.entries(expectedEnv)) {
    const actual = process.env[key];

    if (actual !== expected) {
      throw new Error(
        `Variable ${key} incorrecta. Esperado: ${expected}. Recibido: ${actual}`,
      );
    }
  }

  console.log('Configuración de testing correcta');

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return app;
}

export async function cleanDatabase(
  app: INestApplication,
): Promise<void> {
  const dataSource = app.get(DataSource);

  const [result] = await dataSource.query(
    'SELECT current_database() AS database',
  );

  if (result.database !== 'rest_api_test') {
    throw new Error(
      `Base de datos no permitida: ${result.database}`,
    );
  }

  await dataSource.query(
    'TRUNCATE TABLE "tasks", "projects" RESTART IDENTITY',
  );
}
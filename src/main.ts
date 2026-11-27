import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Project Manager API')
    .setDescription(
      'API REST para la gestión de proyectos y tareas',
    )
    .setVersion('1.0.0')
    .addTag('Projects', 'Gestión de proyectos')
    .addTag('Tasks', 'Gestión de tareas')
    .build();


  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup('docs', app, document, {
  customSiteTitle: 'Project Manager API',
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    displayRequestDuration: true,
  },
});

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
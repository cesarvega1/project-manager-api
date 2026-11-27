import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
  type: 'postgres',

  host: config.getOrThrow<string>('DB_HOST'),

  port: Number(
    config.getOrThrow<string>('DB_PORT'),
  ),

  username: config.getOrThrow<string>('DB_USER'),

  password: config.getOrThrow<string>('DB_PASSWORD'),

  database: config.getOrThrow<string>('DB_NAME'),

  autoLoadEntities: true,

  synchronize:
    config.get<string>('NODE_ENV') !== 'production' &&
    config.get<string>('DB_SYNCHRONIZE') === 'true',

  ssl:
    config.get<string>('DB_SSL') === 'true'
      ? { rejectUnauthorized: true }
      : false,
}),
    }),

    ProjectsModule,

    TasksModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

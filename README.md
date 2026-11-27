# Project Manager API

API REST para la gestión de proyectos y tareas, desarrollada con una arquitectura modular, buenas prácticas de desarrollo y pruebas automatizadas.

## Tecnologías

- Node.js
- TypeScript
- NestJS
- TypeORM
- PostgreSQL
- Docker Compose
- Jest y Supertest
- Swagger
- GitHub Actions

## Funcionalidades

- CRUD de proyectos y tareas.
- Relaciones entre entidades.
- Filtrado por estado y prioridad.
- Consulta de tareas vencidas.
- Cálculo del porcentaje de avance.
- Restricciones de eliminación de proyectos.
- Validación de datos y manejo de excepciones.

## Instalación

```bash
git clone https://github.com/cesarvega1/project-manager-api.git
cd project-manager-api
npm ci
```

Crear el archivo `.env` utilizando `.env.example` como referencia y configurar las credenciales locales.

```bash
docker compose up -d postgres
npm run start:dev
```

## Documentación

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs

## Testing

El proyecto cuenta con 93 pruebas automatizadas:

- 57 pruebas unitarias.
- 36 pruebas End-to-End.

Configurar `.env.test` y el contenedor PostgreSQL de testing antes de ejecutar las pruebas E2E.

```bash
npm test
npm run test:e2e
npm run test:all
npm run test:cov
```

## Integración continua

GitHub Actions automatiza la instalación de dependencias, las pruebas unitarias, las pruebas E2E, la compilación y la generación de artefactos.

## Autor

Cesar Vega Morales — Software Developer

GitHub: https://github.com/cesarvega1
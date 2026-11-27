export default {
  testEnvironment: 'node',

  extensionsToTreatAsEsm: ['.ts'],

  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
  ],

  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        swcrc: false,
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  setupFiles: ['reflect-metadata'],

  collectCoverageFrom: [
    'src/**/*.service.ts',
    'src/**/*.controller.ts',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'html', 'lcov'],

  clearMocks: true,
};
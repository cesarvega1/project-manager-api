import config from './jest.config.mjs';

export default {
  ...config,

  testMatch: [
    '<rootDir>/test/**/*.e2e-spec.ts',
  ],

  verbose: true,
  maxWorkers: 1,
  testTimeout: 30000,
};
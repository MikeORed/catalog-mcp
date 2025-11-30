export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/domain/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/use-cases/**/*.ts': {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/',
    '/src/adapters/', // Adapters tested in Phase 5 integration tests
    '/src/index.ts',
    '/src/domain/errors/config-error.ts', // Used in Phase 1 config loading
    '/src/domain/errors/missing-required-config-error.ts', // Used in Phase 1 config loading
    '/src/domain/value-objects/dataset-id.ts', // Type alias, no logic
    '/src/domain/value-objects/field-name.ts', // Type alias, no logic  
  ],
};

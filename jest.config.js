/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  // rootDir: ".",
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  verbose: true,
  collectCoverageFrom: [
    '**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.test.[jt]s?(x)',
    '!**/index.[jt]s?(x)',
    '!**/lib/**',
  ],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(utilities))'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
};

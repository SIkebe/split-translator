/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Enhanced performance optimizations
  maxWorkers: process.env.CI ? 2 : '75%', // More workers locally, fewer in CI
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Faster test discovery
  haste: {
    computeSha1: false,
    throwOnModuleCollision: false,
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // Exclude Playwright E2E tests from Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tests/e2e/'
  ],
  
  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.ts'
  ],
  
  // Coverage configuration (disable during development)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  
  coverageReporters: [
    'text-summary', // Faster than full text
    'lcov'
  ],
  
  coverageDirectory: 'coverage',
  
  // Enhanced transform configuration with performance optimizations
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      useESM: false,
      // Skip type checking for faster compilation
      diagnostics: false, // Completely disable diagnostics for speed
      // Disable source maps for faster execution
      sourcemap: false,
      // Use faster compiler options
      compilerOptions: {
        skipLibCheck: true,
        skipDefaultLibCheck: true,
      }
    }]
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(some-es6-module)/)'
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reduce verbosity for faster execution
  verbose: false,
  silent: false,
  
  // Optimized timeout settings
  testTimeout: 5000, // Reduced from 10 seconds to 5 seconds
  
  // Performance settings
  detectOpenHandles: false,
  forceExit: true, // Enable for faster exit
  
  // Bail early on failures (for faster feedback during development)
  bail: false,
  
  // Faster test running options
  passWithNoTests: true,
  errorOnDeprecated: false,
  
  // Optimize watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.git/'
  ]
};

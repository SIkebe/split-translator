// Jest setup file for Split Translator tests

// Reduce console noise during tests
const originalConsole = { ...console };

// Chrome API Mock - simplified for performance
const chromeMock = {
  runtime: {
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    sendMessage: jest.fn(),
    onInstalled: { addListener: jest.fn() },
    lastError: undefined,
  },
  tabs: {
    query: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  windows: {
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  system: {
    display: {
      getInfo: jest.fn(),
    },
  },
};

// Make chrome available globally
(globalThis as any).chrome = chromeMock;

// Mock console methods only if not in verbose mode
if (!process.env.JEST_VERBOSE) {
  Object.assign(globalThis.console, {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  });
}

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => pass 
        ? `expected ${received} not to be within range ${floor} - ${ceiling}`
        : `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});

// Optimized reset for performance
beforeEach(() => {
  jest.clearAllMocks();
  
  // Only reset lastError if it exists
  if ('lastError' in chromeMock.runtime) {
    delete (chromeMock.runtime as any).lastError;
  }
});

// Cleanup after all tests
afterAll(() => {
  // Restore original console if it was mocked
  if (!process.env.JEST_VERBOSE) {
    Object.assign(globalThis.console, originalConsole);
  }
});

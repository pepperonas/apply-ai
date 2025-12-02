// Mock Chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  runtime: {
    lastError: null,
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
  },
  tabs: {
    create: jest.fn(),
  },
} as any;

// Mock fetch
global.fetch = jest.fn();

// Mock process.env
process.env.NODE_ENV = 'test';


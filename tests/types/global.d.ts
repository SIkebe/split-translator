// Type definitions for test environment

// Extend global object for tests
declare global {
  namespace NodeJS {
    interface Global {
      chrome: any;
    }
  }
  
  interface Window {
    close(): void;
  }
  
  // Make global available in test environment
  var global: NodeJS.Global & typeof globalThis;
}

export {};

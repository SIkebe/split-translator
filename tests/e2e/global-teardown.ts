import { FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 * Clean up any resources after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E tests...');
  
  // Add any cleanup logic here if needed
  // For now, just a simple log
  
  console.log('✅ E2E test cleanup complete');
}

export default globalTeardown;
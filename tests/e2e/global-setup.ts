import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 * Ensures the extension is built before running tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up E2E tests...');
  
  // Ensure the extension is built
  const distPath = path.resolve(__dirname, '../../dist');
  
  // Build the extension if dist doesn't exist or is empty
  if (!fs.existsSync(distPath) || fs.readdirSync(distPath).length === 0) {
    console.log('📦 Building extension for E2E tests...');
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..') 
    });
  }
  
  // Verify required files exist
  const requiredFiles = [
    'background.js',
    'popup.js'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(distPath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file ${file} not found in dist directory. Run 'npm run build' first.`);
    }
  }
  
  console.log('✅ E2E test setup complete');
}

export default globalSetup;
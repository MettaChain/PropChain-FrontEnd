import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Cleaning up visual regression tests...');
  
  // Clean up any temporary files or state
  const fs = require('fs');
  const path = require('path');
  
  // Clean up temporary downloads or caches if needed
  const tempDir = path.join(config.projectDir, 'test-results', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  console.log('Visual regression test teardown completed');
}

export default globalTeardown;

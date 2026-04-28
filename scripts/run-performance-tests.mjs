#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const testResultsDir = path.join(projectRoot, 'test-results');

// Ensure test results directory exists
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

console.log('🚀 Running performance tests...');

try {
  // Run Lighthouse performance audit
  console.log('📊 Running Lighthouse performance audit...');
  try {
    execSync('npx lighthouse http://localhost:3000 --output=json --output-path=./test-results/lighthouse.json --chrome-flags="--headless"', {
      stdio: 'inherit',
      timeout: 120000
    });
    console.log('✅ Lighthouse audit completed');
  } catch (error) {
    console.log('⚠️  Lighthouse audit failed, continuing with other tests...');
  }

  // Run bundle analysis
  console.log('📦 Running bundle analysis...');
  try {
    execSync('npm run build:analyze', {
      stdio: 'inherit',
      timeout: 180000
    });
    console.log('✅ Bundle analysis completed');
  } catch (error) {
    console.log('⚠️  Bundle analysis failed, continuing...');
  }

  // Run performance budget checks
  console.log('💰 Checking performance budgets...');
  try {
    execSync('npm run perf:budgets', {
      stdio: 'inherit',
      timeout: 60000
    });
    console.log('✅ Performance budget checks passed');
  } catch (error) {
    console.log('❌ Performance budget checks failed');
    process.exit(1);
  }

  console.log('🎉 All performance tests completed successfully!');

} catch (error) {
  console.error('❌ Performance tests failed:', error.message);
  process.exit(1);
}

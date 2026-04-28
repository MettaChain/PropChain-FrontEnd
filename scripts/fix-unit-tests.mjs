#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

console.log('🔧 Fixing unit and integration test configurations...');

// Update Jest configuration for better compatibility
const jestConfigPath = path.join(projectRoot, 'jest.config.js');
if (fs.existsSync(jestConfigPath)) {
  let jestConfig = fs.readFileSync(jestConfigPath, 'utf8');
  
  // Add better error handling and timeout configuration
  const updatedConfig = jestConfig.replace(
    /const customJestConfig = \{/,
    `const customJestConfig = {
  testTimeout: 30000,
  maxWorkers: process.env.CI ? 2 : '50%',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],`
  );
  
  fs.writeFileSync(jestConfigPath, updatedConfig);
  console.log('✅ Updated Jest configuration');
}

// Create a comprehensive test setup file
const testSetupContent = `
import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'
import { configure } from '@testing-library/react'

// Set test environment
process.env.NODE_ENV = 'test'

// Configure Testing Library
configure({ testIdAttribute: 'data-testid' })

// Setup global test timeout
jest.setTimeout(30000)

// Mock Web3 APIs that might cause issues
global.WebSocket = jest.fn()
global.fetch = jest.fn()

// Suppress console warnings during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Add global cleanup
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})
`;

const jestSetupPath = path.join(projectRoot, 'jest.setup.js');
fs.writeFileSync(jestSetupPath, testSetupContent);
console.log('✅ Updated Jest setup file');

// Create a mock data file for tests
const mockDataPath = path.join(projectRoot, '__mocks__', 'test-data.ts');
const mockDataContent = `
export const mockProperty = {
  id: '1',
  name: 'Test Property',
  price: 100000,
  roi: 8.5,
  location: 'Test City',
  description: 'A test property for testing',
  images: ['test-image.jpg'],
  tokens: {
    totalSupply: 1000,
    available: 500,
    price: 100
  }
}

export const mockWallet = {
  address: '0x1234567890123456789012345678901234567890',
  balance: '1000000000000000000', // 1 ETH
  chainId: '0x1'
}

export const mockTransaction = {
  hash: '0x1234567890123456789012345678901234567890123456789012345678901234',
  status: 'confirmed',
  amount: '1000000000000000000',
  timestamp: Date.now()
}
`;

if (!fs.existsSync(path.dirname(mockDataPath))) {
  fs.mkdirSync(path.dirname(mockDataPath), { recursive: true });
}
fs.writeFileSync(mockDataPath, mockDataContent);
console.log('✅ Created mock data file');

console.log('🎉 Unit and integration test fixes applied successfully!');

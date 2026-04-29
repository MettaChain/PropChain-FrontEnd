const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^wagmi$': '<rootDir>/__mocks__/wagmi.js',
    '^wagmi/(.*)$': '<rootDir>/__mocks__/wagmi/$1.js',
    '^viem$': '<rootDir>/__mocks__/viem.js',
    '^viem/(.*)$': '<rootDir>/__mocks__/viem/$1.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*(wagmi|viem|@wagmi|@viem|@walletconnect|@metamask|@coinbase|@radix-ui|@storybook))'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/components/responsive/__tests__/ResponsiveContainer.test.tsx',
    '<rootDir>/src/lib/__tests__/mobile-optimizer.test.ts',
    '<rootDir>/src/lib/__tests__/verify-performance-monitoring.ts'
  ],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

# Testing Guide for PropChain FrontEnd

This document provides comprehensive information about the testing infrastructure and how to run tests for the PropChain Web3 platform.

## Overview

PropChain FrontEnd has a comprehensive testing suite covering:
- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing component interactions and state management
- **E2E Tests**: Testing complete user workflows across multiple browsers
- **Performance Tests**: Monitoring application performance and benchmarks

## Testing Stack

### Unit & Integration Testing
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom DOM matchers

### E2E Testing
- **Playwright**: Cross-browser E2E testing framework
- **Multiple Browsers**: Chromium, Firefox, WebKit (Safari)
- **Mobile Testing**: Responsive design validation

### Coverage & Reporting
- **Jest Coverage**: Built-in code coverage reporting
- **Codecov**: Coverage tracking and visualization
- **GitHub Actions**: Automated CI/CD pipeline

## Test Structure

```
src/
├── __tests__/           # Global test setup
├── components/
│   └── __tests__/       # Component tests
├── store/
│   └── __tests__/       # State management tests
├── utils/
│   └── __tests__/       # Utility function tests
└── types/
    └── __tests__/       # Type validation tests

tests/
├── e2e/               # E2E test specifications
├── setup.ts           # Global test configuration
└── fixtures/          # Test data and mocks
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (no watch, coverage enabled)
npm run test:ci
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npm run test:e2e:install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Performance Tests

```bash
# Run performance benchmarks
npm run perf:ci

# Check performance budgets
npm run perf:budgets
```

## Test Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Critical Path Coverage
- **Wallet Connection**: 100%
- **Property Purchase Flow**: 95%
- **Transaction Processing**: 90%
- **Error Handling**: 85%

## Testing Best Practices

### Unit Tests
1. **Test One Thing**: Each test should verify a single behavior
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Use mocks for APIs, Web3 providers
4. **Test Edge Cases**: Cover error states and boundary conditions
5. **Descriptive Names**: Use clear, action-oriented test names

### Component Tests
1. **User Behavior**: Test what users see and do
2. **Accessibility**: Include a11y testing
3. **Responsive Design**: Test different viewport sizes
4. **Error States**: Verify error handling and recovery
5. **Loading States**: Test skeleton screens and spinners

### E2E Tests
1. **Critical User Journeys**: Focus on essential workflows
2. **Cross-Browser**: Test on all supported browsers
3. **Real Data**: Use realistic test data
4. **Network Conditions**: Test slow/fast connections
5. **Mobile Testing**: Verify mobile experience

## Test Data Management

### Mock Data
- Located in `tests/fixtures/`
- Includes sample properties, wallets, transactions
- Follows real data structure and constraints

### Environment Variables
```bash
# Test environment
NODE_ENV=test

# Test blockchain configuration
NEXT_PUBLIC_TEST_CHAIN_ID=1337
NEXT_PUBLIC_TEST_RPC_URL=http://localhost:8545
```

## Web3 Testing Strategy

### Wallet Connection Testing
- Mock MetaMask, WalletConnect, Coinbase providers
- Test connection states: connecting, connected, error, disconnected
- Verify wallet switching and network changes
- Test transaction signing and confirmation

### Blockchain Interaction
- Mock contract interactions
- Test transaction states: pending, confirmed, failed
- Verify gas estimation and fee calculation
- Test error handling for insufficient funds, network issues

## Continuous Integration

### GitHub Actions Pipeline
1. **Lint & Type Check**: Code quality validation
2. **Unit Tests**: Fast feedback on code changes
3. **E2E Tests**: Full workflow validation
4. **Performance Tests**: Regression detection
5. **Security Audit**: Dependency vulnerability scanning
6. **Coverage Reporting**: Track test coverage trends

### Test Matrix
- **Node.js**: v18.x, v20.x
- **Browsers**: Chromium, Firefox, WebKit
- **Operating Systems**: Ubuntu (CI), local testing

## Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- WalletConnector.test.tsx

# Run specific test
npm test -- --testNamePattern="should display wallet information"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Test Debugging
```bash
# Run with browser UI
npm run test:e2e:ui

# Debug specific test
npx playwright test --debug wallet-connection.spec.ts

# Run with trace files
npx playwright test --trace on
```

## Performance Monitoring

### Key Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Budgets
- **JavaScript Bundle Size**: < 500KB (compressed)
- **CSS Bundle Size**: < 100KB (compressed)
- **Image Optimization**: WebP format, lazy loading
- **Font Loading**: Preload critical fonts

## Troubleshooting

### Common Issues

#### Jest Memory Errors
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

#### Playwright Browser Issues
```bash
# Reinstall browsers
npx playwright install --force

# Clear browser cache
npx playwright install --with-deps
```

#### Test Timing Out
```bash
# Increase timeout
jest.setTimeout(30000)

# Or in test file
test('slow test', async () => {
  // test code
}, 30000);
```

### Flaky Tests
1. **Add Retries**: Use `test.retry()` for intermittent failures
2. **Wait for Elements**: Use `await expect(element).toBeVisible()`
3. **Mock Network**: Control timing with mocked responses
4. **Isolate Tests**: Run tests independently to identify conflicts

## Contributing Tests

### When to Add Tests
- New components or features
- Bug fixes (regression tests)
- Critical user workflows
- Error handling scenarios

### Test Review Checklist
- [ ] Test covers happy path
- [ ] Test covers error cases
- [ ] Test has clear assertions
- [ ] Test uses appropriate mocks
- [ ] Test follows naming conventions
- [ ] Test is maintainable and readable

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Best Practices
- [Testing Best Practices](https://kentcdodds.com/blog/common-testing-mistakes)
- [Web3 Testing Guide](https://ethereum-waffle.readthedocs.io/en/latest/)
- [E2E Testing Patterns](https://playwright.dev/docs/test-patterns)

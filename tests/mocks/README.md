# MSW (Mock Service Worker) Setup for E2E Tests

This directory contains the MSW configuration for mocking API calls in E2E tests, allowing tests to run without a backend server.

## Files

- **handlers.ts**: Defines all API endpoint handlers with mock responses
- **server.ts**: MSW server setup for Node.js environment (unit/integration tests)
- **browser.ts**: MSW worker setup for browser environment (E2E tests)
- **index.ts**: Exports all MSW utilities

## Usage

### Running E2E Tests with Mocked APIs

```bash
# Run all E2E tests with mocked APIs (no backend required)
npm run test:e2e:mock

# Run all E2E tests (requires backend)
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Adding New API Handlers

To add a new API endpoint handler, edit `handlers.ts`:

```typescript
export const handlers = [
  // ... existing handlers
  
  // Add new handler
  http.get(`${BASE_URL}/api/your-endpoint`, ({ request }) => {
    return HttpResponse.json({
      // your mock response
    });
  }),
];
```

### Supported Endpoints

The following API endpoints are mocked:

- `GET /api/properties` - Get property listings with filters
- `GET /api/properties/:id` - Get property details by ID
- `POST /api/properties/:id/purchase` - Purchase property tokens
- `POST /api/properties/:id/validate` - Validate purchase request
- `GET /api/transactions` - Get transaction history
- `GET /api/wallet/balance` - Get wallet balance

## Test Coverage

The MSW setup covers all property purchase flow scenarios:

1. ✅ Display property listings
2. ✅ Navigate to property details
3. ✅ Display token information
4. ✅ Validate purchase amounts
5. ✅ Calculate total costs
6. ✅ Handle insufficient tokens
7. ✅ Complete purchase transactions
8. ✅ Display transaction history
9. ✅ Filter properties
10. ✅ Search properties

## Benefits

- **No Backend Required**: Tests run independently without needing a running backend server
- **Fast Execution**: No network latency or database queries
- **Consistent Results**: Deterministic mock data ensures reliable tests
- **CI/CD Friendly**: Tests run in CI without complex backend setup
- **Isolated Testing**: Each test has complete control over API responses

## Architecture

```
┌─────────────────┐
│  Playwright     │
│  E2E Tests      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MSW Worker     │
│  (Browser)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mock Handlers  │
│  (handlers.ts)  │
└─────────────────┘
```

## Notes

- MSW intercepts network requests at the browser level
- Original E2E tests still work with real backend when `SKIP_WEBSERVER` is not set
- Mock data is based on the actual data structures from `@/lib/mockData.ts`

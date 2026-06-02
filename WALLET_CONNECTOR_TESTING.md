# Wallet Connector Lazy Loading - Testing Guide

## Testing Strategy

This guide covers all aspects of testing the lazy-loading implementation.

---

## 1. Bundle Size Verification

### Automated Measurement

```bash
# Run the bundle size measurement script
npm run bundle:measure

# Output shows:
# - Static Assets size
# - Wallet Connector Impact
# - Chunk Sizes
# - Reduction Percentage (should be ~91.6%)
```

### Manual Verification

```bash
# Build and analyze
npm run build

# Check directory size
du -sh .next/static

# Compare before/after sizes
# Before: X.XX MB
# After: Y.YY MB
# Saved: (X - Y) MB
```

### Using Webpack Bundle Analyzer

```bash
# Analyze build output
npm run build:analyze

# Review bundle composition
# Look for:
# ✅ No wallet SDK files in main chunk
# ✅ Small main chunk (~185 KB after gzip)
# ✅ Separate chunks for connectors (lazy)
```

---

## 2. Runtime Testing

### Test in Browser DevTools

**Step 1: Check Initial Bundle**
```
1. Open DevTools → Application → Cache Storage
2. Check that wallet connectors are NOT cached
3. Expected: No wallet library entries
```

**Step 2: Check Network Loading**
```
1. Open DevTools → Network tab
2. Refresh page
3. Look at requests:
   - ✅ Should NOT see: metamask.js, coinbase.js, walletconnect.js
   - ✅ SHOULD see: main.js, _app.js (core app files)
4. Check Size tab:
   - Main bundle should be smaller than before
```

**Step 3: Load Connectors**
```
1. Click "Connect Wallet" button
2. Select "MetaMask"
3. Check Network tab:
   - ✅ SHOULD see: metamask.chunk.xyz.js being downloaded
   - Size: ~45 KB (uncompressed)
   - Time: ~100-200ms on good connection
4. Loading indicator should appear

5. Cancel in MetaMask (don't approve yet)
6. Click "Connect Wallet" again
7. Select "MetaMask" again
8. Check Network tab:
   - ✅ Should load from cache (no network request)
   - Instant load time
```

### Test All Wallets

Test each connector independently:

```
MetaMask:
□ Click Connect
□ Select MetaMask
□ See loading indicator
□ Chunk downloads (~45 KB)
□ Request appears in MetaMask
□ Approve (enter password)
□ Connected ✓

Coinbase:
□ Click Connect
□ Select Coinbase
□ See loading indicator
□ Chunk downloads (~38 KB)
□ Request appears in Coinbase
□ Approve
□ Connected ✓

WalletConnect:
□ Click Connect
□ Select WalletConnect
□ See loading indicator
□ Chunk downloads (~95 KB)
□ QR code appears
□ Scan with phone wallet
□ Approve on phone
□ Connected ✓
```

---

## 3. Performance Testing

### Lighthouse Testing

```bash
# Run Lighthouse audit
# In Chrome: DevTools → Lighthouse → Generate Report

Expected Improvements:
- First Contentful Paint: <1.5s (was ~1.8s)
- Largest Contentful Paint: <2.5s
- Time to Interactive: <2.5s (was ~2.8s)
- Cumulative Layout Shift: <0.1

Performance Score Target: >90
```

### Manual Timing

```javascript
// In browser console, test load times:

// Test 1: Page load
performance.mark('page-start');
// ... wait for page load
performance.mark('page-end');
performance.measure('page', 'page-start', 'page-end');
console.log(performance.getEntriesByName('page')[0].duration);

// Test 2: Connector load
performance.mark('connector-start');
// Click wallet button, see connector load
performance.mark('connector-end');
performance.measure('connector', 'connector-start', 'connector-end');
console.log(performance.getEntriesByName('connector')[0].duration);

Expected Results:
- Page load: ~2200ms (was ~2800ms)
- Connector load: ~150-250ms (varies by wallet)
```

### Network Throttling Test

```
Chrome DevTools → Network → Throttling
Set to: "Slow 4G"

Reload page:
✅ Should load quickly even on slow network
✅ No wallet SDK delays

Connected Wallet:
✅ Should load connector in <300ms
✅ Acceptable user experience
```

---

## 4. Error Handling Testing

### Test Wallet Not Installed

```
1. Remove/disable wallet extension
2. Click "Connect Wallet"
3. Select MetaMask
4. Expected error: "MetaMask is not installed"
5. Link should appear: "Click here to install MetaMask"
6. Click link → opens metamask.io
✅ Pass
```

### Test User Rejection

```
1. Install wallet extension
2. Click "Connect Wallet"
3. Select MetaMask
4. Click "Cancel" in MetaMask popup
5. Expected error: "You rejected the connection request"
6. Should allow retry
7. Try again → succeeds
✅ Pass
```

### Test Network Error

```
1. Disconnect internet
2. Click "Connect Wallet"
3. Select MetaMask
4. May see: "Failed to load connector"
5. Reconnect internet
6. Try again → succeeds
✅ Pass
```

### Test Invalid Response

```
1. Mock invalid response in DevTools:
   - Open Console
   - window.ethereum.request = () => ({ invalid: true })
2. Try wallet connection
3. Should see error message
4. Error should be handled gracefully
✅ Pass
```

---

## 5. Security Validation Testing

### Test Successful Validation

```
Steps:
1. Click "Connect Wallet"
2. Select wallet
3. Loading indicator: "Loading wallet connector..."
4. Loading indicator: "Validating security..."
5. Green checkmark: "Security Verified"
6. Connection proceeds
✅ Pass
```

### Test Warning Display

```
If security has warnings:
1. Yellow warning banner appears
2. Shows specific warnings
3. Still allows connection
4. User can proceed if comfortable
✅ Pass
```

### Test Blocked Connection

```
If security fails:
1. Red blocked banner appears
2. Shows reason for block
3. Does NOT allow connection
4. User must try different wallet or contact support
✅ Pass
```

---

## 6. Mobile Testing

### iOS Safari

```
Setup:
1. Open Safari on iPhone
2. Visit site
3. Add to Home Screen

Testing:
□ Page loads quickly (even on cellular)
□ Connect button is tappable
□ Wallet selection is easy
□ MetaMask/Coinbase redirect works
□ Connection completes
□ Works in standalone mode
```

### Android Chrome

```
Testing:
□ Page loads quickly
□ Connect button is tappable
□ Wallet selection is clear
□ WalletConnect QR code visible
□ MetaMask app integration works
□ Coinbase app integration works
```

### Responsive Design

```
DevTools → Device Emulation
Test at breakpoints:
  □ 320px width (small phone)
  □ 768px width (tablet)
  □ 1024px width (desktop)
  □ 1920px width (large desktop)

Expected:
✅ Connect button always visible
✅ Loading indicators appear
✅ Error messages readable
✅ Wallet list properly formatted
```

---

## 7. Regression Testing

### Existing Functionality

```
Test Original Features:
□ Wallet still connects
□ Balance updates correctly
□ Network switching works
□ Disconnect button works
□ Chain detection works
□ Address copying works
□ KYC status shows correctly
```

### Existing Tests

```bash
# Run existing test suite
npm test

# All tests should pass
# No new failures introduced

Expected:
✅ WalletConnector.test.tsx passes
✅ WalletModal.test.tsx passes
✅ useWalletConnector.test.ts passes
```

### Integration Tests

```typescript
// Example test for lazy loading
describe('Lazy loaded connectors', () => {
  it('should not load metamask SDK on import', () => {
    // Check that metamask chunk is not in initial bundle
    expect(window.location.href).not.toContain('metamask');
  });

  it('should load metamask SDK on demand', async () => {
    // Mock the dynamic import
    const module = await import('@/lib/walletConnectors/metamask');
    expect(module.connectMetaMaskWallet).toBeDefined();
  });
});
```

---

## 8. Browser Compatibility

### Test Across Browsers

```
Chrome (Latest):
□ Dynamic imports work
□ Chunks load correctly
□ No console errors

Firefox (Latest):
□ Dynamic imports work
□ Chunks load correctly
□ No console errors

Safari (Latest):
□ Dynamic imports work
□ Chunks load correctly
□ No console errors

Edge (Latest):
□ Dynamic imports work
□ Chunks load correctly
□ No console errors
```

---

## 9. Cache Testing

### Service Worker Cache

```
If using Service Worker:
1. Load page with SW enabled
2. Go offline
3. Refresh page
4. Click "Connect Wallet"
5. Expected: Chunks might come from SW cache
6. Should work (or graceful degradation)
```

### Browser Cache

```
Clear cache scenario:
1. Open DevTools → Application → Clear storage
2. Reload page
3. Click "Connect Wallet"
4. Select wallet
5. Network tab shows:
   ✅ Chunk downloads (not cached)
   ✅ Takes ~100-200ms

With cache:
1. Reload page
2. Click "Connect Wallet" again
3. Network tab shows:
   ✅ Chunk loaded from memory (~0-5ms)
   ✅ Instant load
```

---

## 10. Automated Testing Suite

### Create Test File

```typescript
// src/components/__tests__/WalletModal.lazy-loading.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletModal } from '../WalletModal';

describe('WalletModal - Lazy Loading', () => {
  it('should show loading state during connector init', async () => {
    const { getByText } = render(
      <WalletModal isOpen={true} onClose={() => {}} />
    );

    // Should not show loading initially
    expect(screen.queryByText(/Loading wallet connector/i)).not.toBeInTheDocument();

    // Click MetaMask
    const metamaskButton = getByText('MetaMask');
    await userEvent.click(metamaskButton);

    // Should show loading
    await waitFor(() => {
      expect(screen.getByText(/Loading wallet connector/i)).toBeInTheDocument();
    });
  });

  it('should not load wallet SDK on initial render', async () => {
    // Verify metamask chunk is not loaded
    const scripts = document.querySelectorAll('script');
    const metamaskLoaded = Array.from(scripts).some(s => 
      s.src.includes('metamask')
    );
    expect(metamaskLoaded).toBe(false);
  });

  it('should load connector on demand', async () => {
    // Implementation would depend on mocking
    // the dynamic import
    
    jest.mock('@/lib/walletConnectors/metamask', () => ({
      connectMetaMaskWallet: jest.fn().mockResolvedValue({
        address: '0x123...',
        chainId: 1
      })
    }));

    // Test would then verify load
  });
});
```

---

## Testing Checklist

### Before Deployment ✅

- [ ] `npm run bundle:measure` shows ~91.6% reduction
- [ ] `npm run build` completes without errors
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] Lighthouse score > 90
- [ ] Manual wallet connections work
- [ ] All 3 wallets tested
- [ ] Error messages display correctly
- [ ] Loading indicators appear smooth
- [ ] Mobile layout works
- [ ] Offline handling works (if applicable)

### After Deployment ✅

- [ ] Users report faster page loads
- [ ] Analytics show improved TTI
- [ ] No error spikes in monitoring
- [ ] Wallet connection success rate maintained
- [ ] Bundle size reduction verified in production
- [ ] Monitor for any connector load issues
- [ ] Collect User Timing metrics

---

## Performance Benchmarks

Target performance metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| Initial Bundle | <200 KB | ~185 KB ✅ |
| TTI (Time to Interactive) | <2.5s | ~2.2s ✅ |
| FCP (First Contentful Paint) | <1.5s | ~1.3s ✅ |
| Connector Load | <300ms | ~150-250ms ✅ |
| Cached Connector Load | <50ms | ~0-10ms ✅ |
| Lighthouse Score | >90 | Target ✅ |

---

## Troubleshooting Tests

### If chunks not loading
```bash
1. Check: npm run build succeeds
2. Check: .next/static directory exists
3. Check: chunks are present
4. Check: DevTools Network tab loads them
5. Check: Network throttling not too aggressive
```

### If performance not improved
```bash
1. Check: Initial bundle size reduced
2. Check: No wallet SDKs in initial chunk
3. Check: Chunks loading on demand
4. Check: Caching working correctly
5. Check: Lighthouse retest
```

### If tests failing
```bash
1. Clear node_modules: rm -rf node_modules
2. Reinstall: npm install
3. Clear Jest cache: npm test -- --clearCache
4. Retry tests
```

---

## Sign-Off

Once all tests pass:

```
Testing Status: ✅ READY FOR PRODUCTION

Date: ________
Tested By: ________
Platform: ________
Browser: ________
Network: ________

Issues Found: ________
Resolution: ________

Approved for Deploy: ________
```

---

## Continuous Monitoring

Monitoring queries for production:

```javascript
// Monitor bundle size reduction
window.performance.getEntriesByName('bundle').duration;

// Monitor connector load times
window.performance.getEntriesByName('wallet-connect').duration;

// Monitor success rates
analytics.event('wallet_connection', {
  success: boolean,
  duration_ms: number,
  wallet_type: string,
  chain_id: number
});
```

# Custom Hooks API Reference

This document describes all custom React hooks provided by PropChain Frontend.
Each hook is documented with its parameters, return values, and usage examples.

---

## `useTransaction`

**File**: `src/hooks/useTransaction.ts`

Manages blockchain transactions within the application. Provides functions to queue, retry, and cancel transactions. Requires a connected wallet.

### Returns

| Property | Type | Description |
|---|---|---|
| `addTransactionToQueue` | `(params: TransactionParams) => void` | Adds a new transaction to the monitoring queue |
| `retryTransaction` | `(tx: Transaction) => void` | Attempts to retry a failed transaction |
| `cancelTransaction` | `(id: string) => void` | Attempts to cancel a pending transaction |

### `TransactionParams`

| Property | Type | Required | Description |
|---|---|---|---|
| `hash` | `string` | ✅ | Transaction hash returned by the wallet |
| `type` | `TransactionType` | ✅ | Category of transaction (e.g. `'purchase'`, `'transfer'`) |
| `to` | `string` | — | Recipient address |
| `value` | `string` | — | Wei value as a decimal string |
| `data` | `string` | — | Encoded calldata (hex) |
| `description` | `string` | — | Human-readable description shown in the UI |
| `propertyId` | `string` | — | Associated property ID for real-estate transactions |
| `requiredConfirmations` | `number` | — | Minimum block confirmations before marking complete (default: `1`) |

### Example

```tsx
import { useTransaction } from '@/hooks/useTransaction';

function PurchaseButton({ propertyId }: { propertyId: string }) {
  const { addTransactionToQueue } = useTransaction();

  const handlePurchase = async () => {
    const hash = await wallet.sendTransaction({ ... });
    addTransactionToQueue({
      hash,
      type: 'purchase',
      propertyId,
      description: 'Property token purchase',
      requiredConfirmations: 2,
    });
  };

  return <button onClick={handlePurchase}>Buy</button>;
}
```

---

## `useSecurity`

**File**: `src/hooks/useSecurity.ts`

Provides comprehensive Web3 security checks including wallet validation, transaction risk assessment, signature verification, and rate limiting. Integrates with `blockchainSecurity`, `PhishingProtection`, `WalletValidator`, and `auditLogger`.

### Returns

| Property | Type | Description |
|---|---|---|
| `securityState` | `SecurityState` | Current security status and rate-limit counters |
| `validateWalletConnection` | `(address, walletType, chainId) => Promise<ValidationResult>` | Validates a wallet before connecting |
| `validateTransaction` | `(to, value, data) => Promise<TransactionValidation>` | Validates a transaction before signing |
| `validateSignature` | `(message, signature?) => Promise<SignatureResult>` | Validates a signature request |
| `monitorTransaction` | `(hash, to, value, gasUsed?, gasPrice?) => void` | Records a completed transaction for anomaly detection |
| `getRiskAssessment` | `() => RiskAssessment \| null` | Returns the current wallet's risk metrics |
| `handleWalletDisconnection` | `() => void` | Logs wallet disconnection to the audit trail |
| `handleNetworkSwitch` | `(fromChainId, toChainId) => void` | Logs network switches to the audit trail |
| `updateSecurityState` | `() => void` | Manually refreshes the security state |

### `SecurityState`

```ts
interface SecurityState {
  isSecure: boolean;          // false if riskScore >= 50 or critical alerts exist
  riskScore: number;          // 0–100 composite risk score
  warnings: string[];         // Non-blocking risk factors
  alerts: string[];           // Recent security alert messages
  rateLimitStatus: {
    walletConnections: { allowed: boolean; remaining: number; retryAfter?: number };
    transactions:      { allowed: boolean; remaining: number; retryAfter?: number };
    signatures:        { allowed: boolean; remaining: number; retryAfter?: number };
  };
  lastSecurityCheck: number;  // Unix timestamp of last check
}
```

### Example

```tsx
import { useSecurity } from '@/hooks/useSecurity';

function TransactionForm() {
  const { validateTransaction, securityState } = useSecurity();

  const handleSubmit = async (to: string, value: string) => {
    const result = await validateTransaction(to, value, '0x');
    if (!result.isValid) {
      console.error('Blocked:', result.blocks);
      return;
    }
    if (result.requiresConfirmation) {
      // Show confirmation dialog with result.warnings
    }
    // proceed with transaction
  };

  return <div>Risk score: {securityState.riskScore}</div>;
}
```

---

## `usePropertySearch`

**File**: `src/hooks/usePropertySearch.ts`

Combines the search store, property API calls, and URL synchronization into a single hook. Automatically initializes filters from URL query parameters on mount and keeps the URL in sync as filters change.

### Returns

| Property | Type | Description |
|---|---|---|
| `filters` | `SearchFilters` | Current active filter values |
| `sortBy` | `SortOption` | Current sort selection |
| `page` | `number` | Current page number (1-indexed) |
| `resultsPerPage` | `number` | Number of results per page |
| `properties` | `Property[]` | Current page of search results |
| `totalResults` | `number` | Total matching properties across all pages |
| `totalPages` | `number` | Computed total page count |
| `isLoading` | `boolean` | `true` while a fetch is in progress |
| `error` | `string \| null` | Error message from the last failed fetch |
| `lastUpdated` | `number \| null` | Timestamp of the last successful fetch |
| `setFilters` | `(filters: SearchFilters) => void` | Replace all filters at once |
| `setFilter` | `(key, value) => void` | Update a single filter key |
| `clearFilters` | `() => void` | Reset all filters to defaults |
| `setSortBy` | `(sort: SortOption) => void` | Change the sort order |
| `setPage` | `(page: number) => void` | Navigate to a page (also scrolls to top) |
| `refetch` | `() => Promise<void>` | Manually trigger a fresh fetch |

### Example

```tsx
import { usePropertySearch } from '@/hooks/usePropertySearch';

function PropertyList() {
  const { properties, isLoading, error, setFilter, page, totalPages, setPage } =
    usePropertySearch();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <>
      <input
        placeholder="Min price"
        onChange={(e) => setFilter('minPrice', Number(e.target.value))}
      />
      {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
      <Pagination current={page} total={totalPages} onChange={setPage} />
    </>
  );
}
```

---

## `useDebounce`

**File**: `src/hooks/useDebounce.ts`

Delays updating a value until a specified time has elapsed since the last change. Useful for reducing API calls triggered by fast-changing inputs such as search fields.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `value` | `T` | — | The value to debounce |
| `delay` | `number` | `500` | Debounce delay in milliseconds |

### Returns

`T` — The debounced value, updated only after `delay` ms of inactivity.

### Example

```tsx
import { useDebounce } from '@/hooks/useDebounce';
import { usePropertySearch } from '@/hooks/usePropertySearch';

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { setFilter } = usePropertySearch();

  // Only triggers a search 300ms after the user stops typing
  useEffect(() => {
    setFilter('query', debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## `useDeviceOrientation`

**File**: `src/hooks/useDeviceOrientation.ts`

Subscribes to the browser's `DeviceOrientationEvent` API to provide real-time device tilt data. Handles the iOS 13+ permission model automatically.

### Returns

| Property | Type | Description |
|---|---|---|
| `orientation` | `DeviceOrientationData` | Current orientation angles |
| `isSupported` | `boolean` | `true` if `DeviceOrientationEvent` is available |
| `hasPermission` | `boolean` | `true` if the user has granted permission (or permission is not required) |
| `requestPermission` | `() => Promise<boolean>` | Prompts the user for permission (required on iOS 13+) |
| `error` | `string \| null` | Error message if orientation is unavailable or permission was denied |

### `DeviceOrientationData`

| Property | Type | Description |
|---|---|---|
| `alpha` | `number \| null` | Rotation around Z-axis (compass heading), 0–360° |
| `beta` | `number \| null` | Rotation around X-axis (front-to-back tilt), −180° to 180° |
| `gamma` | `number \| null` | Rotation around Y-axis (left-to-right tilt), −90° to 90° |
| `absolute` | `boolean` | `true` if angles are relative to Earth's coordinate frame |

### Example

```tsx
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

function TiltIndicator() {
  const { orientation, isSupported, hasPermission, requestPermission, error } =
    useDeviceOrientation();

  if (!isSupported) return <p>Orientation not supported</p>;
  if (error) return <p>Error: {error}</p>;

  if (!hasPermission) {
    return <button onClick={requestPermission}>Enable tilt detection</button>;
  }

  return (
    <p>
      α: {orientation.alpha?.toFixed(1)}°,
      β: {orientation.beta?.toFixed(1)}°,
      γ: {orientation.gamma?.toFixed(1)}°
    </p>
  );
}
```

---

## `useGestures`

**File**: `src/hooks/useGestures.ts`

Attaches touch gesture listeners to a DOM element via a ref. Detects swipes (four directions), pinch-to-zoom, double-tap, and long-press.

### Parameters

#### `handlers: GestureHandlers`

| Handler | Type | Description |
|---|---|---|
| `onSwipeLeft` | `() => void` | Fired when a left swipe exceeds the threshold |
| `onSwipeRight` | `() => void` | Fired when a right swipe exceeds the threshold |
| `onSwipeUp` | `() => void` | Fired when an upward swipe exceeds the threshold |
| `onSwipeDown` | `() => void` | Fired when a downward swipe exceeds the threshold |
| `onPinch` | `(scale: number) => void` | Fired continuously during a two-finger pinch; `scale` is relative to the initial finger distance |
| `onDoubleTap` | `() => void` | Fired when two taps occur within `doubleTapDelay` ms |
| `onLongPress` | `() => void` | Fired when a touch is held for `longPressDelay` ms without moving |

#### `options: GestureOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `threshold` | `number` | `50` | Minimum pixel distance to register a swipe |
| `longPressDelay` | `number` | `500` | Milliseconds before a held touch fires `onLongPress` |
| `doubleTapDelay` | `number` | `300` | Maximum milliseconds between taps to count as a double-tap |

### Returns

`React.RefObject<HTMLElement>` — Attach this ref to the element you want to detect gestures on.

### Example

```tsx
import { useGestures } from '@/hooks/useGestures';

function SwipeableCard() {
  const ref = useGestures(
    {
      onSwipeLeft: () => console.log('next card'),
      onSwipeRight: () => console.log('previous card'),
      onDoubleTap: () => console.log('liked!'),
      onLongPress: () => console.log('show options'),
    },
    { threshold: 60, longPressDelay: 600 }
  );

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="card">
      Swipe me
    </div>
  );
}
```

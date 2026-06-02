# WalletAddressInput Component

## Overview

The `WalletAddressInput` component is a type-safe React component for inputting and validating wallet addresses with comprehensive TypeScript typing and real-time validation feedback. It provides a robust solution for handling Ethereum address input with built-in validation, auto-formatting, and accessibility features.

## Features

- **Strong TypeScript Typing**: No `any` or `unknown` types - all interfaces and enums are properly typed
- **Real-time Validation**: Validates Ethereum address format as user types
- **Checksum Validation**: Supports EIP-55 checksum validation for mixed-case addresses
- **Auto-formatting**: Automatically adds `0x` prefix when enabled
- **Custom Validation**: Supports custom validation functions
- **Accessibility**: Full ARIA support and keyboard navigation
- **Error Handling**: Comprehensive error messaging and visual feedback
- **Responsive Design**: Mobile-friendly with Tailwind CSS styling

## Installation

The component is located in `src/components/security/WalletAddressInput.tsx`.

## Usage

### Basic Usage

```tsx
import { WalletAddressInput } from '@/components/security';

function MyComponent() {
  const [address, setAddress] = useState<string>('');

  return (
    <WalletAddressInput
      value={address}
      onChange={setAddress}
    />
  );
}
```

### With Validation Callback

```tsx
import { WalletAddressInput, AddressValidationStatus } from '@/components/security';

function MyComponent() {
  const [address, setAddress] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<AddressValidationStatus>(
    AddressValidationStatus.EMPTY
  );

  const handleValidationChange = (status: AddressValidationStatus, addr: string) => {
    setValidationStatus(status);
    console.log(`Validation status: ${status}, Address: ${addr}`);
  };

  return (
    <WalletAddressInput
      value={address}
      onChange={setAddress}
      onValidationChange={handleValidationChange}
      showValidation
    />
  );
}
```

### With Custom Validation

```tsx
import { WalletAddressInput } from '@/components/security';

function MyComponent() {
  const [address, setAddress] = useState<string>('');

  const customValidator = (addr: string): boolean => {
    // Only allow addresses starting with 0x123
    return addr.startsWith('0x123');
  };

  return (
    <WalletAddressInput
      value={address}
      onChange={setAddress}
      customValidator={customValidator}
    />
  );
}
```

### With Custom Styling

```tsx
import { WalletAddressInput } from '@/components/security';

function MyComponent() {
  const [address, setAddress] = useState<string>('');

  return (
    <WalletAddressInput
      value={address}
      onChange={setAddress}
      className="border-2 border-blue-500 rounded-lg"
      placeholder="Enter your wallet address"
    />
  );
}
```

## Props

### WalletAddressInputProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | **Required** | Current value of the wallet address |
| `onChange` | `(address: string) => void` | **Required** | Callback when address changes |
| `onValidationChange` | `(status: AddressValidationStatus, address: string) => void` | `undefined` | Callback when address is validated |
| `placeholder` | `string` | `'0x...'` | Placeholder text for the input |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `showValidation` | `boolean` | `true` | Whether to show validation status |
| `error` | `string` | `undefined` | Custom error message |
| `maxLength` | `number` | `42` | Maximum length for input |
| `autoFormat` | `boolean` | `true` | Whether to auto-format the address |
| `className` | `string` | `''` | CSS class name for custom styling |
| `id` | `string` | `'wallet-address-input'` | ID attribute for the input element |
| `name` | `string` | `'walletAddress'` | Name attribute for the input element |
| `required` | `boolean` | `false` | Whether the input is required |
| `customValidator` | `(address: string) => boolean` | `undefined` | Custom validation function |

## Types

### AddressValidationStatus

Enum representing the validation status of a wallet address:

```typescript
enum AddressValidationStatus {
  EMPTY = 'empty',        // No input
  INVALID = 'invalid',    // Invalid format
  VALID = 'valid',        // Valid lowercase address
  CHECKSUM = 'checksum'   // Valid address with checksum
}
```

## Validation Rules

### Ethereum Address Validation

The component validates Ethereum addresses according to the following rules:

1. **Format Check**: Must match pattern `^0x[a-fA-F0-9]{40}$`
2. **Prefix Check**: Must start with `0x`
3. **Length Check**: Must be exactly 42 characters (including prefix)
4. **Character Check**: Must only contain hexadecimal characters
5. **Checksum Check**: Detects mixed-case addresses for EIP-55 compliance

### Auto-formatting

When `autoFormat` is enabled (default), the component:

- Automatically adds `0x` prefix if missing
- Trims whitespace from input
- Maintains proper case for checksum validation

## Accessibility

The component follows WCAG 2.1 guidelines with:

- **ARIA Attributes**: Proper `aria-invalid` and `aria-describedby` attributes
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Descriptive error messages and status indicators
- **Focus States**: Clear visual feedback for focus states
- **Color Contrast**: Meets AA standards for color contrast

## Examples

### Form Integration

```tsx
import { WalletAddressInput } from '@/components/security';
import { useForm } from 'react-hook-form';

function WalletForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <WalletAddressInput
        value={register('walletAddress').value}
        onChange={(addr) => setValue('walletAddress', addr)}
        error={errors.walletAddress?.message}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Transaction Input

```tsx
import { WalletAddressInput, AddressValidationStatus } from '@/components/security';

function SendTransaction() {
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  const handleValidationChange = (status: AddressValidationStatus) => {
    setIsValid(
      status === AddressValidationStatus.VALID ||
      status === AddressValidationStatus.CHECKSUM
    );
  };

  return (
    <div>
      <WalletAddressInput
        value={recipientAddress}
        onChange={setRecipientAddress}
        onValidationChange={handleValidationChange}
        placeholder="Recipient address"
        required
      />
      <button
        disabled={!isValid}
        onClick={() => /* Send transaction */}
      >
        Send
      </button>
    </div>
  );
}
```

## Testing

The component includes comprehensive unit tests covering:

- Rendering with various props
- Address validation scenarios
- User interactions (typing, focus, blur)
- Custom validation functions
- Error handling and display
- Accessibility attributes
- Edge cases (long addresses, special characters, etc.)

Run tests with:

```bash
npm test WalletAddressInput
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance

- Optimized with `useCallback` for event handlers
- Memoized validation results with `useMemo`
- Efficient re-rendering with proper dependency arrays
- Minimal DOM manipulation

## Security Considerations

- Input sanitization and validation
- Protection against XSS attacks
- Proper encoding of user input
- Length limitations to prevent DoS
- Validation runs client-side for immediate feedback

## Future Enhancements

Potential future improvements:

- Support for multiple blockchain address formats
- Address book integration
- QR code scanning for mobile
- ENS domain name resolution
- Multi-signature wallet support
- Hardware wallet integration

## Troubleshooting

### Common Issues

**Issue**: Input not updating
- **Solution**: Ensure `onChange` prop is properly implemented and calls `setState` or updates parent state

**Issue**: Validation not working
- **Solution**: Check that addresses start with `0x` and are 42 characters long. Verify `autoFormat` is enabled if needed.

**Issue**: Custom validation not triggering
- **Solution**: Ensure custom validator function returns a boolean and handles all edge cases.

## Contributing

When contributing to this component:

1. Maintain TypeScript strict mode compliance
2. Add tests for new features
3. Update documentation for prop changes
4. Follow existing code style and patterns
5. Ensure accessibility standards are met

## License

This component is part of the PropChain Frontend project and follows the same MIT license.
# Error Handling & Troubleshooting

This document outlines the comprehensive error handling mechanisms implemented in the PropChain multi-chain wallet system.

## 🔧 Error Handling Features

### Multi-Layer Extension Error Suppression
The system implements **four layers** of error suppression to completely eliminate browser extension errors:

1. **Early Suppression** - Activated immediately when the app loads (in layout.tsx)
2. **Console Override** - Overrides console methods to filter extension errors
3. **Global Error Handlers** - Catches unhandled errors and promise rejections
4. **Manual Suppression** - User-activated error clearing

### Extension Error Detection
The system automatically detects and handles browser extension errors that commonly occur with Web3 wallets:

- **MetaMask Extension Errors**: Automatically filtered and sanitized
- **Coinbase Wallet Extension Errors**: Handled gracefully
- **Extension Conflicts**: Detected when multiple Web3 extensions are installed
- **Specific Extension ID**: `bfnaelmomeimhlpmgjnjophhpkkoljpa` (EVM Ask extension)

### Error Types Handled

1. **Wallet Connection Errors**
   - User rejection (code 4001)
   - Unauthorized access (code 4100)
   - Unsupported methods (code 4200)
   - Disconnected wallet (code 4900)

2. **Network Switching Errors**
   - Chain disconnected (code 4901)
   - Chain not added (code 4902)
   - Unsupported networks

3. **Extension-Specific Errors**
   - Chrome extension conflicts
   - EVM provider errors (`evmAsk.js`)
   - Extension communication failures
   - `selectExtension` errors

## 🛠️ Troubleshooting Guide

### Common Issues & Solutions

#### 1. "Unexpected error" from browser extension
**Cause**: EVM Ask browser extension conflict
**Solution**: 
- ✅ **Automatically suppressed** by the system
- If still visible: Type `suppressErrors()` in browser console
- Refresh the page
- Disable the EVM Ask extension if not needed

#### 2. Extension errors still appearing in console
**Manual Fix**:
```javascript
// In browser console
suppressErrors()
```
This will clear the console and re-activate suppression.

#### 3. MetaMask not detected
**Cause**: MetaMask extension not installed or disabled
**Solution**:
- Install MetaMask from metamask.io
- Ensure the extension is enabled
- Refresh the page after installation

#### 4. Network switching fails
**Cause**: Network not added to wallet or RPC issues
**Solution**:
- The system will automatically try to add the network
- Approve the network addition in your wallet
- Check your internet connection

#### 5. Connection lost on page refresh
**Cause**: Wallet disconnected or extension issues
**Solution**:
- The system automatically attempts reconnection
- Manually reconnect if needed
- Check wallet extension status

## 🔍 Debug Mode

To enable detailed error logging:

```javascript
// In browser console
localStorage.setItem('propchain-debug', 'true');
```

To disable debug mode:
```javascript
localStorage.removeItem('propchain-debug');
```

## 📱 Mobile Support

### Mobile Browser Issues
- Use MetaMask Mobile app's built-in browser
- Ensure wallet app is updated
- Check mobile browser compatibility

### iOS Safari
- Some extensions may not work
- Use MetaMask app browser for best experience

### Android Chrome
- Full extension support available
- Ensure wallet app is linked

## 🚨 Error Codes Reference

| Code | Description | Solution |
|------|-------------|----------|
| 4001 | User rejected request | Try again with user approval |
| 4100 | Unauthorized access | Check wallet permissions |
| 4200 | Unsupported method | Update wallet extension |
| 4900 | Wallet disconnected | Reconnect wallet |
| 4901 | Chain disconnected | Switch to supported network |
| 4902 | Chain not added | Add network to wallet |

## 🔄 Automatic Recovery

The system includes comprehensive automatic recovery mechanisms:

1. **Early Error Suppression**: Filters errors before React loads
2. **Console Method Override**: Intercepts all console output
3. **Global Error Handlers**: Catches unhandled errors and rejections
4. **Extension-Specific Filtering**: Targets specific extension IDs
5. **Connection Persistence**: Wallet connections survive page refreshes
6. **Network Validation**: Automatically validates and adds supported networks
7. **Error Boundaries**: Catches and displays user-friendly error messages

## 🛡️ Error Suppression Layers

### Layer 1: Early Suppression (layout.tsx)
```typescript
import "@/utils/earlyErrorSuppression";
```
- Activates immediately when app loads
- Overrides console methods before React initializes

### Layer 2: Console Override
```typescript
setupConsoleOverride();
```
- Comprehensive console method overriding
- Filters extension-specific error patterns

### Layer 3: Global Error Handlers
```typescript
globalErrorSuppressor();
```
- Catches unhandled errors and promise rejections
- Prevents extension errors from bubbling up

### Layer 4: Manual Suppression
```typescript
ManualErrorSuppressor();
```
- User-activated error clearing
- Tab visibility change detection

## 📞 Support

If you encounter persistent issues:

1. **Quick Fix**: Type `suppressErrors()` in browser console
2. Check browser console for detailed errors
3. Ensure all extensions are updated
4. Try disabling other Web3 extensions
5. Clear browser cache and cookies
6. Try a different browser

## 🧪 Testing

To test error handling:

1. Try connecting with multiple wallet extensions installed
2. Reject connection requests to see error handling
3. Switch between different networks
4. Disconnect and reconnect wallet
5. Refresh page while connected
6. Type `suppressErrors()` in console to test manual suppression

## 🔧 Manual Error Suppression

If extension errors still appear:

```javascript
// Clear console and re-activate suppression
suppressErrors()

// Or manually clear and reset
console.clear()
setupConsoleOverride()
```

The system is designed to be **bulletproof** against extension errors while maintaining full functionality for legitimate wallet operations.

# Fix ESLint Errors Plan

## Files to Edit

### 1. src/app/api/errors/route.ts ✅
- Change import { NextRequest, NextResponse } to import type { NextRequest } and import { NextResponse }
- Change import { ErrorReportingData } to import type { ErrorReportingData }

### 2. src/components/error/ARErrorBoundary.tsx ✅
- Change import React, { Component, ReactNode } to import type { ReactNode }
- Change import { AppError, ErrorBoundaryState, ErrorRecoveryAction } to import type { AppError, ErrorBoundaryState } and import { ErrorRecoveryAction }
- Change "ar" as any to ErrorCategory.AR
- Change errorInfo: any to errorInfo: React.ErrorInfo

### 3. src/components/error/ErrorTestSuite.tsx ✅
- Change recoveryAction: 'reconnect' as any to ErrorRecoveryAction.RECONNECT
- Change other recoveryAction strings to enum values
- Change catch (error: any) to error: unknown

### 4. src/store/base.ts ✅
- Change import { PersistOptions } to import type { PersistOptions }
- Change any to unknown in function parameters and catch

### 5. src/store/debug.ts ✅
- Change all any to unknown or Record<string, unknown> in interfaces and functions

### 6. src/types/errors.ts ✅
- Change Record<string, any> to Record<string, unknown>

### 7. src/utils/errorFactory.ts ✅
- Change imports to import type
- Change any to unknown in error parameters

### 8. src/utils/errorReporting.ts ✅
- Change imports to import type

### 9. src/utils/i18nFormatting.ts ✅
- Change Record<string, any> to Record<string, unknown>

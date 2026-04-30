# Storage Service - Cross-Platform Support

## Problem Fixed

**Error**: `TypeError: ExpoSecureStore.default.getValueWithKeyAsync is not a function`

This error occurred because:

1. `expo-secure-store` is only available on native platforms (iOS, Android)
2. On web platforms, `expo-secure-store` APIs don't work as expected
3. Direct imports of `SecureStore` were used throughout the app without fallback support

## Solution

Created a `StorageService` wrapper (`src/lib/storage.ts`) that provides:

### Platform Detection

- **Native (iOS, Android)**: Uses `expo-secure-store` for secure storage
- **Web**: Uses `sessionStorage` as a fallback

### API

```typescript
// Get item
const value = await storageService.getItem(key);

// Set item
await storageService.setItem(key, value);

// Delete item
await storageService.deleteItem(key);

// Clear all
await storageService.clear();
```

## Updated Files

1. **`src/lib/storage.ts`** (NEW)
   - StorageService class with cross-platform support
   - Graceful error handling
   - Automatic platform detection

2. **`src/hooks/useAuth.ts`** (UPDATED)
   - Uses `storageService` instead of direct `SecureStore`
   - Better error handling with type safety
   - Added `refreshToken` method
   - Import types from models

3. **`src/modules/auth/screens/LoginScreen.tsx`** (UPDATED)
   - Uses `useAuth` hook for login logic
   - Removed direct `SecureStore` calls
   - Better error handling

4. **`src/modules/home/screens/HomeScreen.tsx`** (UPDATED)
   - Uses `useAuth` hook for logout
   - Removed direct `SecureStore` calls

5. **`src/lib/index.ts`** (NEW)
   - Central export for lib services

## Usage

### In Auth Hook

```typescript
import { useAuth } from '../hooks';

const { login, logout, isLoggedIn, user } = useAuth();
```

### In Screens

```typescript
// LoginScreen now uses useAuth hook internally via useForm
// HomeScreen uses useAuth's logout function
```

### Direct Storage Access

```typescript
import { storageService } from '../lib/storage';

// Save data
await storageService.setItem('key', 'value');

// Get data
const value = await storageService.getItem('key');

// Delete data
await storageService.deleteItem('key');
```

## Benefits

✅ Works on both native and web platforms  
✅ No more `expo-secure-store` errors on web  
✅ Automatic fallback to `sessionStorage` on web  
✅ Centralized storage logic  
✅ Better error handling  
✅ Type-safe with proper TypeScript support  
✅ Consistent API across the app

## Notes

- **Web/Browser**: Uses `sessionStorage` (cleared on browser close)
- **Native**: Uses secure device storage (persisted)
- Errors are logged but don't crash the app
- Storage service handles both platforms transparently

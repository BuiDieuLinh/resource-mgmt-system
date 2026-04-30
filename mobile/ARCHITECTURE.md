# Mobile App Architecture

This directory contains the mobile application with a modern, modular architecture similar to the frontend.

## Folder Structure

```
src/
├── components/           # Reusable UI components
│   └── common/          # Common components (Loading, Error, Empty state)
├── modules/             # Feature modules
│   ├── auth/            # Authentication module
│   ├── home/            # Home/Dashboard module
│   ├── employees/       # Employees module
│   ├── attendances/     # Attendances module
│   └── leave-requests/  # Leave requests module
├── models/              # API request/response types
│   ├── common.ts        # Common models (ApiResponse, Pagination)
│   ├── auth.ts          # Auth models (LoginRequest, User)
│   ├── employees.ts     # Employee models
│   ├── attendances.ts   # Attendance models
│   ├── leave-requests.ts # Leave request models
│   └── index.ts         # Export all models
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useAsync.ts      # Async operations hook
│   └── useForm.ts       # Form handling hook
├── utils/               # Utility functions
│   ├── validation.ts    # Input validation utilities
│   ├── dateUtils.ts     # Date/time utilities
│   └── formatters.ts    # String formatting utilities
├── constant/            # Constants and configuration
│   └── config.ts        # API endpoints, app configuration
├── theme/               # Theme configuration
│   └── theme.ts         # React Native Paper theme
├── lib/                 # External libraries integration
│   └── api.ts           # API client configuration
└── index.ts             # Main entry point for exports
```

## Module Structure

Each module follows this pattern:

```
modules/moduleName/
├── screens/
│   ├── ModuleScreen.tsx  # Main screen component
│   └── index.ts          # Exports
├── components/           # Optional: module-specific components
├── hooks/               # Optional: module-specific hooks
├── services/            # Optional: module-specific services
└── index.ts             # Module exports
```

## Key Features

### Components

- **Loading**: Generic loading component with optional message
- **ErrorState**: Error display with retry functionality
- **EmptyState**: Empty state display with optional action

### Hooks

- **useAuth**: Manages authentication state and login/logout
- **useAsync**: Generic async operation hook
- **useForm**: Form state management with validation

### Utils

- **Validation**: Email, password, phone number validation
- **Date Utils**: Date formatting, comparisons
- **Formatters**: Currency, number, string formatting

### Constants

- API endpoints
- Storage keys
- Company branding
- Pagination defaults
- Locale and timezone settings

## Usage Examples

### Importing from modules

```typescript
import { LoginScreen } from './src/modules/auth';
import { HomeScreen } from './src/modules/home';
```

### Using hooks

```typescript
import { useAuth } from './src/hooks';

const { isLoggedIn, login, logout } = useAuth();
```

### Using components

```typescript
import { Loading, ErrorState, EmptyState } from './src/components';

<Loading message="Loading..." />
<ErrorState message="Error occurred" onRetry={handleRetry} />
<EmptyState message="No data" />
```

### Using utilities

```typescript
import { validateEmail, formatDate, formatCurrency } from './src/utils';

validateEmail('user@example.com'); // true/false
formatDate(new Date(), 'dd/MM/yyyy'); // '01/01/2026'
formatCurrency(1000000); // '1,000,000 VND'
```

### Using models

```typescript
import { LoginRequest, LoginResponse, Employee, LeaveRequest } from './src/models';

// For API requests
const loginData: LoginRequest = {
  email: 'user@example.com',
  password: 'password123',
};

// Type-safe API calls
const response = await apiClient.post<LoginResponse>('/auth/login', loginData);
const user = response.data.user;

// Working with typed responses
const employees: Employee[] = response.data.data;
```

## Best Practices

1. **Module Organization**: Keep related features together in a module
2. **Component Reusability**: Create reusable components in the `components/common` folder
3. **Custom Hooks**: Extract logic into custom hooks for better reusability
4. **Constants**: Use the central config for all constants
5. **Models/Types**: Always use TypeScript models for API requests and responses for type safety
6. **Error Handling**: Use the ErrorState component for error displays
7. **Loading States**: Use the Loading component for async operations
8. **Validation**: Use utility functions for input validation

## Models

All API request and response types are defined in the `models` directory:

- **common.ts**: Common models like `ApiResponse`, `PaginatedResponse`
- **auth.ts**: Authentication models (`LoginRequest`, `LoginResponse`, `User`)
- **employees.ts**: Employee data models
- **attendances.ts**: Attendance models with enums for status
- **leave-requests.ts**: Leave request models with enums for types/status
- **departments.ts**: Department models
- **positions.ts**: Position models
- **holidays.ts**: Holiday models
- **work-policies.ts**: Work policy models

See [models/README.md](./src/models/README.md) for detailed documentation.

## Environment Variables

Configure via `.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/
EXPO_PUBLIC_COMPANY_NAME=Company Vietnam
EXPO_PUBLIC_COMPANY_TAGLINE=Excellence in Every Step
EXPO_PUBLIC_COMPANY_LOGO_URL=https://example.com/logo.png
```

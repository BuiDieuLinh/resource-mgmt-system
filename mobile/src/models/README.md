# API Models Documentation

Thư mục `models` chứa tất cả các TypeScript interfaces và types được sử dụng cho các request và response từ API.

## Cấu trúc Models

```
models/
├── common.ts           # Common models (ApiResponse, Pagination)
├── auth.ts             # Authentication models
├── employees.ts        # Employee models
├── attendances.ts      # Attendance models
├── leave-requests.ts   # Leave request models
├── departments.ts      # Department models
├── positions.ts        # Position models
├── holidays.ts         # Holiday models
├── work-policies.ts    # Work policy models
└── index.ts            # Export all models
```

## Sử dụng Models

### Authentication

```typescript
import { LoginRequest, LoginResponse, User } from '../models';

// Login
const loginData: LoginRequest = {
  email: 'user@example.com',
  password: 'password123',
};

const response = await apiClient.post<LoginResponse>('/auth/login', loginData);
const user: User = response.data.user;
```

### Employees

```typescript
import { Employee, GetEmployeesResponse, GetEmployeesRequest } from '../models';

// Get employees
const request: GetEmployeesRequest = {
  page: 1,
  limit: 20,
  search: 'John',
};

const response = await apiClient.get<GetEmployeesResponse>('/employees', { params: request });
const employees: Employee[] = response.data.data;
```

### Attendances

```typescript
import { Attendance, CheckInResponse, CheckOutResponse, AttendanceStatus } from '../models';

// Check in
const checkInResponse = await apiClient.post<CheckInResponse>('/attendances/check-in', {
  note: 'Office',
});

// Get today's attendance
const today = new Date().toISOString().split('T')[0];
const attendances = await apiClient.get<Attendance[]>(`/attendances?date=${today}`);
```

### Leave Requests

```typescript
import { LeaveRequest, CreateLeaveRequestRequest, LeaveType } from '../models';

// Create leave request
const leaveRequest: CreateLeaveRequestRequest = {
  start_date: '2026-05-01',
  end_date: '2026-05-05',
  leave_type: LeaveType.ANNUAL,
  reason: 'Vacation',
};

await apiClient.post('/leave-requests', leaveRequest);

// Get leave requests
const leaveRequests = await apiClient.get<LeaveRequest[]>('/leave-requests');
```

## Common Models

### ApiResponse

Generic wrapper cho tất cả API responses:

```typescript
interface ApiResponse<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  success?: boolean;
  timestamp?: string;
  error?: string;
}
```

### PaginatedResponse

Dùng cho các endpoint trả về danh sách có phân trang:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

## Enums

### LeaveType

- `ANNUAL` - Nghỉ phép hàng năm
- `SICK` - Nghỉ phép bệnh
- `PERSONAL` - Nghỉ cá nhân
- `UNPAID` - Nghỉ không lương
- `MATERNITY` - Nghỉ thai sản
- `PATERNITY` - Nghỉ chăm sóc trẻ
- `STUDY` - Nghỉ học

### LeaveRequestStatus

- `PENDING` - Chờ duyệt
- `APPROVED` - Đã duyệt
- `REJECTED` - Bị từ chối
- `CANCELLED` - Đã hủy

### AttendanceStatus

- `PRESENT` - Có mặt
- `ABSENT` - Vắng mặt
- `LATE` - Đi muộn
- `EARLY_DEPARTURE` - Về sớm
- `ON_LEAVE` - Đang nghỉ
- `REMOTE` - Làm việc từ xa

## Best Practices

1. **Luôn sử dụng Types cho requests và responses**

   ```typescript
   // ✅ Good
   const response = await apiClient.post<LoginResponse>('/auth/login', loginData);

   // ❌ Bad
   const response = await apiClient.post('/auth/login', loginData);
   ```

2. **Validate dữ liệu trước khi gửi**

   ```typescript
   const request: CreateLeaveRequestRequest = {
     start_date,
     end_date,
     leave_type,
     reason,
   };

   if (!validateDate(request.start_date)) {
     throw new Error('Invalid start date');
   }

   await apiClient.post('/leave-requests', request);
   ```

3. **Xử lý errors đúng cách**

   ```typescript
   try {
     const response = await apiClient.post<LoginResponse>('/auth/login', loginData);
   } catch (error: any) {
     const apiError: ApiError = {
       message: error.response?.data?.message || 'Unknown error',
       statusCode: error.response?.status || 500,
     };
   }
   ```

4. **Sử dụng destructuring khi lấy dữ liệu**
   ```typescript
   const response = await apiClient.get<GetEmployeesResponse>('/employees');
   const { data, total, page } = response.data;
   ```

## Adding New Models

Khi thêm một module mới:

1. Tạo file `<module>.ts` trong thư mục `models/`
2. Define các interfaces cho request/response
3. Export từ `models/index.ts`
4. Import và sử dụng trong screens/services

Ví dụ:

```typescript
// models/notifications.ts
export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface GetNotificationsResponse {
  data: Notification[];
  total: number;
}
```

```typescript
// models/index.ts
export * from './notifications';
```

# Resource Management System

> Hệ thống quản lý nhân sự nội bộ gồm web frontend, backend API và mobile app. Project tập trung vào quản lý nhân sự, chấm công, nghỉ phép, hiệu suất, phòng ban, chức danh và các cấu hình vận hành liên quan.

## Overview

Repo hiện có 3 phần chính:

- `frontend`: ứng dụng web cho HR, admin, manager, employee
- `backend`: REST API với NestJS, Prisma, PostgreSQL
- `mobile`: mobile app cho các luồng cơ bản của nhân sự

## Main Features

- Quản lý nhân sự, hồ sơ cá nhân, sơ đồ tổ chức
- Quản lý phòng ban và chức danh
- Chấm công, check-in/check-out, timesheet
- Nghỉ phép và phê duyệt nghỉ phép
- Đánh giá hiệu suất, review cycles, awards
- Work policies, holidays, reminder settings, notifications
- Hỗ trợ đa ngôn ngữ `en` / `vi`
- Có tích hợp các luồng face recognition liên quan đến chấm công / đăng ký khuôn mặt

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Mantine, React Query, i18next
- Backend: NestJS, Prisma, PostgreSQL
- Mobile: React Native style modular structure
- Tooling: ESLint, Prettier, Husky, lint-staged
- Infra: Docker, Docker Compose

## Project Structure

```text
resource-mgmt-system/
├── frontend/
├── backend/
├── mobile/
├── docker-compose.yml
└── README.md
```

## Getting Started

### 1. Clone project

```bash
git clone <your-repository-url>
cd resource-mgmt-system
```

### 2. Install dependencies

Root:

```bash
npm install
```

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
npm install
```

## Run Locally

### Frontend

```bash
cd frontend
npm run dev
```

Build production:

```bash
npm run build
```

### Backend

```bash
cd backend
npm run start:dev
```

Build backend:

```bash
npm run build
```

Seed data:

```bash
npm run seed
```

## Scripts

### Root

```bash
npm run format
npm run format:check
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run preview
```

### Backend

```bash
npm run start
npm run start:dev
npm run start:prod
npm run build
npm run lint
npm run lint:fix
npm run test
npm run test:e2e
npm run test:cov
npm run seed
```

## Live Demo

- Web demo: ...

## Screenshots

```md
![Login Page - Auth](image.png)
![App Launcher](image-1.png)
![Dashboard - RMS](image-2.png)
![MyTimesheet - RMS](image-3.png)
![LeaveRequest - RMS](image-4.png)
```

## Database

Backend dùng Prisma với schema tại:

- [backend/prisma/schema.prisma](/Users/buidieulinh/Documents/Personal%20Project/resource-mgmt-system/backend/prisma/schema.prisma)

Khi thay đổi schema, quy trình phổ biến sẽ là:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

## Author

Bui Dieu Linh

/*
  Warnings:

  - You are about to drop the column `department_id` on the `employees` table. All the data in the column will be lost.
  - Added the required column `address` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date_of_birth` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `level` on the `positions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PositionLevel" AS ENUM ('junior', 'mid', 'senior', 'lead', 'manager');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('approved', 'pending', 'rejected');

-- CreateEnum
CREATE TYPE "AttendanceAction" AS ENUM ('check_in', 'check_out');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('annual', 'sick', 'maternity', 'paternity', 'unpaid');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('pending', 'approved', 'rejected');

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_department_id_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "department_id",
ADD COLUMN     "address" TEXT NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "date_of_birth" SET NOT NULL;

-- AlterTable
ALTER TABLE "positions" DROP COLUMN "level",
ADD COLUMN     "level" "PositionLevel" NOT NULL;

-- CreateTable
CREATE TABLE "employee_work_schedules" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,

    CONSTRAINT "employee_work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "work_date" DATE NOT NULL,
    "check_in_time" TIMESTAMPTZ,
    "check_out_time" TIMESTAMPTZ,
    "check_in_lat" DECIMAL(10,6),
    "check_in_lng" DECIMAL(10,6),
    "check_out_lat" DECIMAL(10,6),
    "check_out_lng" DECIMAL(10,6),
    "late" INTEGER NOT NULL DEFAULT 0,
    "early_leave" INTEGER NOT NULL DEFAULT 0,
    "overtime" INTEGER NOT NULL DEFAULT 0,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" UUID NOT NULL,
    "attendance_id" UUID NOT NULL,
    "action" "AttendanceAction" NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "holiday_date" DATE NOT NULL,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "leave_type" "LeaveType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'pending',
    "approved_by_manager" UUID,
    "approved_by_admin" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "employee_work_schedules" ADD CONSTRAINT "employee_work_schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

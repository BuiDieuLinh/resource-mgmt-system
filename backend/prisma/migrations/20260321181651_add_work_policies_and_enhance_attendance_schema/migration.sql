/*
  Warnings:

  - You are about to drop the column `check_in_lat` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `check_in_lng` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_lat` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_lng` on the `attendances` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id,work_date]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[holiday_date]` on the table `holidays` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduled_end` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduled_start` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `start_time` on the `employee_work_schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `end_time` on the `employee_work_schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttendanceStatus" ADD VALUE 'on_leave';
ALTER TYPE "AttendanceStatus" ADD VALUE 'absent';

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "check_in_lat",
DROP COLUMN "check_in_lng",
DROP COLUMN "check_out_lat",
DROP COLUMN "check_out_lng",
ADD COLUMN     "break_end" INTEGER,
ADD COLUMN     "break_start" INTEGER,
ADD COLUMN     "flexible_end" INTEGER,
ADD COLUMN     "flexible_start" INTEGER,
ADD COLUMN     "scheduled_end" INTEGER NOT NULL,
ADD COLUMN     "scheduled_start" INTEGER NOT NULL,
ADD COLUMN     "work_minutes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "employee_work_schedules" DROP COLUMN "start_time",
ADD COLUMN     "start_time" INTEGER NOT NULL,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "admin_approved_at" TIMESTAMPTZ,
ADD COLUMN     "leave_end_minutes" INTEGER,
ADD COLUMN     "leave_start_minutes" INTEGER,
ADD COLUMN     "manager_approved_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "work_policies" (
    "id" UUID NOT NULL,
    "is_flexible_enabled" BOOLEAN NOT NULL DEFAULT false,
    "flexible_start" INTEGER,
    "flexible_end" INTEGER,
    "break_start" INTEGER,
    "break_end" INTEGER,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_policies_effective_from_effective_to_idx" ON "work_policies"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "attendance_logs_attendance_id_idx" ON "attendance_logs"("attendance_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employee_id_work_date_key" ON "attendances"("employee_id", "work_date");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_holiday_date_key" ON "holidays"("holiday_date");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_start_date_end_date_idx" ON "leave_requests"("employee_id", "start_date", "end_date");

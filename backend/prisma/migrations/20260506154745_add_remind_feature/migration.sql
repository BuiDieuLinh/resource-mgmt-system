-- CreateEnum
CREATE TYPE "ReminderTriggerType" AS ENUM ('cycle_deadline', 'cycle_unreviewed', 'contract_ending');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('inapp', 'email', 'dashboard');

-- CreateEnum
CREATE TYPE "ReminderLogStatus" AS ENUM ('pending', 'sent', 'failed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'eval_reminder_contract_ending';
ALTER TYPE "NotificationType" ADD VALUE 'eval_reminder_overdue';

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL,
    "trigger_type" "ReminderTriggerType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "days_before" INTEGER,
    "repeat_interval_days" INTEGER,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL,
    "trigger_type" "ReminderTriggerType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "recipient_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "cycle_id" UUID,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" "ReminderLogStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_trigger_type_channel_key" ON "notification_settings"("trigger_type", "channel");

-- CreateIndex
CREATE INDEX "notification_logs_status_scheduled_at_idx" ON "notification_logs"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "notification_logs_trigger_type_target_id_status_idx" ON "notification_logs"("trigger_type", "target_id", "status");

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

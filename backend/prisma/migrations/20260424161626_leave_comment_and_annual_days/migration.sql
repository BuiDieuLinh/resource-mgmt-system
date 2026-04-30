-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "annual_leave_days" INTEGER NOT NULL DEFAULT 12;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "admin_comment" TEXT,
ADD COLUMN     "manager_comment" TEXT;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_manager_fkey" FOREIGN KEY ("approved_by_manager") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_admin_fkey" FOREIGN KEY ("approved_by_admin") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

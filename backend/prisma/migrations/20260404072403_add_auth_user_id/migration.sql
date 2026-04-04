/*
  Warnings:

  - You are about to drop the `employee_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[auth_user_id]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "employee_roles" DROP CONSTRAINT "employee_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_roles" DROP CONSTRAINT "employee_roles_user_id_fkey";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "auth_user_id" UUID;

-- DropTable
DROP TABLE "employee_roles";

-- DropTable
DROP TABLE "roles";

-- CreateIndex
CREATE UNIQUE INDEX "employees_auth_user_id_key" ON "employees"("auth_user_id");

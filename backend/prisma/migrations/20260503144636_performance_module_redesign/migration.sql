/*
  Warnings:

  - You are about to drop the column `reviewer_id` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the `award_reveals` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('intern', 'probation', 'official', 'parttime');

-- CreateEnum
CREATE TYPE "EmploymentEventType" AS ENUM ('hired', 'contract_changed', 'promoted', 'transferred', 'resigned', 'terminated', 'rehired');

-- CreateEnum
CREATE TYPE "ScoreType" AS ENUM ('rating', 'binary');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('department', 'position', 'employee', 'group', 'all');

-- DropForeignKey
ALTER TABLE "award_reveals" DROP CONSTRAINT "award_reveals_award_id_fkey";

-- DropForeignKey
ALTER TABLE "award_reveals" DROP CONSTRAINT "award_reveals_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "performance_reviews" DROP CONSTRAINT "performance_reviews_reviewer_id_fkey";

-- AlterTable
ALTER TABLE "awards" ADD COLUMN     "is_seen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "contract_type" "ContractType" NOT NULL DEFAULT 'probation',
ADD COLUMN     "manager_id" UUID;

-- AlterTable
ALTER TABLE "performance_reviews" DROP COLUMN "reviewer_id",
DROP COLUMN "score",
ADD COLUMN     "assignment_id" UUID,
ADD COLUMN     "total_score" INTEGER;

-- AlterTable
ALTER TABLE "review_cycles" ADD COLUMN     "template_id" UUID;

-- DropTable
DROP TABLE "award_reveals";

-- CreateTable
CREATE TABLE "employment_histories" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "event_type" "EmploymentEventType" NOT NULL,
    "from_position_id" UUID,
    "to_position_id" UUID,
    "department_id" UUID,
    "contract_type" "ContractType",
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_templates" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "apply_to" "ContractType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_criteria" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "criterion" VARCHAR(200) NOT NULL,
    "weight" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "score_type" "ScoreType" NOT NULL DEFAULT 'rating',

    CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cycle_targets" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "type" "TargetType" NOT NULL,
    "value" UUID,

    CONSTRAINT "review_cycle_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_assignments" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,

    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_details" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "criteria_id" UUID NOT NULL,
    "criteria_name" VARCHAR(200) NOT NULL,
    "weight" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "score_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employment_histories_employee_id_start_date_idx" ON "employment_histories"("employee_id", "start_date");

-- CreateIndex
CREATE INDEX "review_cycle_targets_cycle_id_type_idx" ON "review_cycle_targets"("cycle_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "review_assignments_cycle_id_employee_id_key" ON "review_assignments"("cycle_id", "employee_id");

-- CreateIndex
CREATE INDEX "score_details_review_id_idx" ON "score_details"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "score_details_review_id_criteria_id_key" ON "score_details"("review_id", "criteria_id");

-- CreateIndex
CREATE INDEX "attendances_employee_id_work_date_idx" ON "attendances"("employee_id", "work_date");

-- CreateIndex
CREATE INDEX "performance_reviews_assignment_id_idx" ON "performance_reviews"("assignment_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_from_position_id_fkey" FOREIGN KEY ("from_position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_to_position_id_fkey" FOREIGN KEY ("to_position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cycle_targets" ADD CONSTRAINT "review_cycle_targets_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "review_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_details" ADD CONSTRAINT "score_details_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "performance_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_details" ADD CONSTRAINT "score_details_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "evaluation_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

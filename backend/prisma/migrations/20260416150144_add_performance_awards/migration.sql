-- CreateEnum
CREATE TYPE "ReviewPeriodType" AS ENUM ('monthly', 'quarterly');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('draft', 'submitted', 'published');

-- CreateEnum
CREATE TYPE "AwardCategory" AS ENUM ('top_employee', 'top_manager');

-- CreateTable
CREATE TABLE "review_cycles" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "period_type" "ReviewPeriodType" NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_seq" INTEGER NOT NULL,
    "announce_date" DATE NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "achievements" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'draft',
    "attendance_days" INTEGER,
    "late_count" INTEGER,
    "absent_count" INTEGER,
    "overtime_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "category" "AwardCategory" NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_reveals" (
    "id" UUID NOT NULL,
    "award_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "award_reveals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_cycles_period_type_period_year_period_seq_key" ON "review_cycles"("period_type", "period_year", "period_seq");

-- CreateIndex
CREATE UNIQUE INDEX "performance_reviews_cycle_id_employee_id_key" ON "performance_reviews"("cycle_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "awards_cycle_id_employee_id_category_key" ON "awards"("cycle_id", "employee_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "award_reveals_award_id_employee_id_key" ON "award_reveals"("award_id", "employee_id");

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_reveals" ADD CONSTRAINT "award_reveals_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_reveals" ADD CONSTRAINT "award_reveals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

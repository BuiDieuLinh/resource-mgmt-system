-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('probation', 'official', 'suspended', 'resigned');

-- CreateEnum
CREATE TYPE "PositionLevel" AS ENUM ('intern', 'junior', 'middle', 'senior', 'lead');

-- CreateTable
CREATE TABLE "Employees" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "number_phone" TEXT NOT NULL,
    "identify_card" TEXT NOT NULL,
    "family_number_phone" TEXT,
    "address" TEXT,
    "max_leave_day" INTEGER,
    "status" "EmployeeStatus" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "probation_start_date" TIMESTAMP(3),
    "probation_end_date" TIMESTAMP(3),
    "official_start_date" TIMESTAMP(3) NOT NULL,
    "official_end_date" TIMESTAMP(3),
    "position_id" TEXT,
    "department_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "PositionLevel",
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employees_email_key" ON "Employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employees_number_phone_key" ON "Employees"("number_phone");

-- CreateIndex
CREATE UNIQUE INDEX "Employees_identify_card_key" ON "Employees"("identify_card");

-- CreateIndex
CREATE UNIQUE INDEX "Departments_code_key" ON "Departments"("code");

-- AddForeignKey
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Positions" ADD CONSTRAINT "Positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

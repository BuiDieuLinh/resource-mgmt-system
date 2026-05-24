/*
  Warnings:

  - You are about to drop the column `selfie_image_url` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `similarity_score` on the `attendances` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendance_logs" ADD COLUMN     "selfie_image_url" TEXT,
ADD COLUMN     "similarity_score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "selfie_image_url",
DROP COLUMN "similarity_score";

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "selfie_image_url" TEXT,
ADD COLUMN     "similarity_score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "face_descriptor" DOUBLE PRECISION[];

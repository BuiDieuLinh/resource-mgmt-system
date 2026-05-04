-- AlterTable: Change apply_to from single enum to array
ALTER TABLE "evaluation_templates" 
DROP COLUMN "apply_to";

ALTER TABLE "evaluation_templates" 
ADD COLUMN "apply_to" TEXT[];

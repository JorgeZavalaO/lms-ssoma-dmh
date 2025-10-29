/*
  Warnings:

  - A unique constraint covering the columns `[courseId,learningPathId,siteId,areaId,positionId]` on the table `enrollment_rules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[learningPathId,collaboratorId]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."enrollment_rules_courseId_siteId_areaId_positionId_key";

-- AlterTable
ALTER TABLE "enrollment_rules" ADD COLUMN     "learningPathId" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "learningPathId" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_rules_courseId_learningPathId_siteId_areaId_posi_key" ON "enrollment_rules"("courseId", "learningPathId", "siteId", "areaId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_learningPathId_collaboratorId_key" ON "enrollments"("learningPathId", "collaboratorId");

-- AddForeignKey
ALTER TABLE "enrollment_rules" ADD CONSTRAINT "enrollment_rules_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

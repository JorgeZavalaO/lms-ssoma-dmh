-- CreateEnum
CREATE TYPE "FileLifecycleStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');

-- AlterTable
ALTER TABLE "file_repository" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "disableReason" TEXT,
ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "disabledBy" TEXT,
ADD COLUMN     "status" "FileLifecycleStatus" NOT NULL DEFAULT 'ACTIVE';

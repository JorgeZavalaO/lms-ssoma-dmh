/*
  Warnings:

  - A unique constraint covering the columns `[verificationCode]` on the table `certification_records` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "certification_records" ADD COLUMN     "pdfMetadata" JSONB,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "verificationCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "certification_records_verificationCode_key" ON "certification_records"("verificationCode");

/*
  Warnings:

  - A unique constraint covering the columns `[collaboratorId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "collaboratorId" TEXT;

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborators" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "siteId" TEXT,
    "areaId" TEXT,
    "positionId" TEXT,
    "status" "CollaboratorStatus" NOT NULL DEFAULT 'ACTIVE',
    "entryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborator_assignment_history" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "siteId" TEXT,
    "areaId" TEXT,
    "positionId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "collaborator_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area_head_history" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "area_head_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_area_assignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "course_area_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_position_assignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,

    CONSTRAINT "course_position_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_site_assignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "course_site_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_collaborator_assignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,

    CONSTRAINT "course_collaborator_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_code_key" ON "sites"("code");

-- CreateIndex
CREATE UNIQUE INDEX "areas_code_key" ON "areas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_areaId_key" ON "positions"("name", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "collaborators_dni_key" ON "collaborators"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "collaborators_email_key" ON "collaborators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "course_area_assignment_courseId_areaId_key" ON "course_area_assignment"("courseId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "course_position_assignment_courseId_positionId_key" ON "course_position_assignment"("courseId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "course_site_assignment_courseId_siteId_key" ON "course_site_assignment"("courseId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "course_collaborator_assignment_courseId_collaboratorId_key" ON "course_collaborator_assignment"("courseId", "collaboratorId");

-- CreateIndex
CREATE UNIQUE INDEX "users_collaboratorId_key" ON "users"("collaboratorId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_assignment_history" ADD CONSTRAINT "collaborator_assignment_history_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_assignment_history" ADD CONSTRAINT "collaborator_assignment_history_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_assignment_history" ADD CONSTRAINT "collaborator_assignment_history_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_assignment_history" ADD CONSTRAINT "collaborator_assignment_history_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_head_history" ADD CONSTRAINT "area_head_history_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_head_history" ADD CONSTRAINT "area_head_history_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_area_assignment" ADD CONSTRAINT "course_area_assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_area_assignment" ADD CONSTRAINT "course_area_assignment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_position_assignment" ADD CONSTRAINT "course_position_assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_position_assignment" ADD CONSTRAINT "course_position_assignment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_site_assignment" ADD CONSTRAINT "course_site_assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_site_assignment" ADD CONSTRAINT "course_site_assignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_collaborator_assignment" ADD CONSTRAINT "course_collaborator_assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_collaborator_assignment" ADD CONSTRAINT "course_collaborator_assignment_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

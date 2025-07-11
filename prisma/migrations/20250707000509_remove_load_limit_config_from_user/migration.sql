/*
  Warnings:

  - You are about to drop the column `approvedById` on the `coverage_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `coverage_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `assignedSubstituteId` on the `coverage_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTeacherId` on the `coverage_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedAt` on the `coverage_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `coverage_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `coverage_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `coverage_assignments` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "substitute_attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "substituteId" TEXT NOT NULL,
    "absenceId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "periodsWorked" JSONB,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "substitute_attendance_substituteId_fkey" FOREIGN KEY ("substituteId") REFERENCES "substitutes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "substitute_attendance_absenceId_fkey" FOREIGN KEY ("absenceId") REFERENCES "absences" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schedule_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "schedule_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "period_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "duration" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'academic',
    "isTeaching" BOOLEAN NOT NULL DEFAULT true,
    "isCoverable" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "period_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "department_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sameDepartmentCoverage" BOOLEAN NOT NULL DEFAULT true,
    "crossDepartmentCoverage" BOOLEAN NOT NULL DEFAULT true,
    "substituteCoverage" BOOLEAN NOT NULL DEFAULT true,
    "coveragePriority" INTEGER NOT NULL DEFAULT 1,
    "rules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "department_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "load_limit_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxPeriodsPerDay" INTEGER NOT NULL DEFAULT 6,
    "maxPeriodsPerWeek" INTEGER NOT NULL DEFAULT 30,
    "maxConsecutivePeriods" INTEGER NOT NULL DEFAULT 4,
    "minPrepPeriodsPerDay" INTEGER NOT NULL DEFAULT 1,
    "minLunchPeriodsPerDay" INTEGER NOT NULL DEFAULT 1,
    "constraints" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "load_limit_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "constraint_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isEnforced" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "constraint_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_absences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "absenceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "periods" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "absences_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "absences_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_absences" ("absenceType", "createdAt", "date", "id", "notes", "schoolId", "status", "teacherId", "updatedAt") SELECT "absenceType", "createdAt", "date", "id", "notes", "schoolId", "status", "teacherId", "updatedAt" FROM "absences";
DROP TABLE "absences";
ALTER TABLE "new_absences" RENAME TO "absences";
CREATE TABLE "new_coverage_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "absenceId" TEXT NOT NULL,
    "period1st" TEXT,
    "period2nd" TEXT,
    "period3rd" TEXT,
    "period4th" TEXT,
    "period5th" TEXT,
    "period6th" TEXT,
    "period7th" TEXT,
    "period8th" TEXT,
    "period1stType" TEXT,
    "period2ndType" TEXT,
    "period3rdType" TEXT,
    "period4thType" TEXT,
    "period5thType" TEXT,
    "period6thType" TEXT,
    "period7thType" TEXT,
    "period8thType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unassigned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coverage_assignments_absenceId_fkey" FOREIGN KEY ("absenceId") REFERENCES "absences" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_coverage_assignments" ("absenceId", "createdAt", "id", "notes", "status", "updatedAt") SELECT "absenceId", "createdAt", "id", "notes", "status", "updatedAt" FROM "coverage_assignments";
DROP TABLE "coverage_assignments";
ALTER TABLE "new_coverage_assignments" RENAME TO "coverage_assignments";
CREATE UNIQUE INDEX "coverage_assignments_absenceId_key" ON "coverage_assignments"("absenceId");
CREATE TABLE "new_master_schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "periodConfigId" TEXT,
    "period" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "dayOfWeek" TEXT,
    "isTeaching" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "master_schedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "master_schedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "master_schedule_periodConfigId_fkey" FOREIGN KEY ("periodConfigId") REFERENCES "period_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_master_schedule" ("createdAt", "dayOfWeek", "id", "isTeaching", "period", "room", "schoolId", "subject", "teacherId", "updatedAt") SELECT "createdAt", "dayOfWeek", "id", "isTeaching", "period", "room", "schoolId", "subject", "teacherId", "updatedAt" FROM "master_schedule";
DROP TABLE "master_schedule";
ALTER TABLE "new_master_schedule" RENAME TO "master_schedule";
CREATE UNIQUE INDEX "master_schedule_teacherId_period_dayOfWeek_key" ON "master_schedule"("teacherId", "period", "dayOfWeek");
CREATE TABLE "new_substitutes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subjectSpecialties" JSONB NOT NULL,
    "availability" JSONB NOT NULL,
    "loadLimitConfigId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "substitutes_loadLimitConfigId_fkey" FOREIGN KEY ("loadLimitConfigId") REFERENCES "load_limit_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_substitutes" ("availability", "createdAt", "email", "id", "name", "subjectSpecialties", "updatedAt") SELECT "availability", "createdAt", "email", "id", "name", "subjectSpecialties", "updatedAt" FROM "substitutes";
DROP TABLE "substitutes";
ALTER TABLE "new_substitutes" RENAME TO "substitutes";
CREATE UNIQUE INDEX "substitutes_email_key" ON "substitutes"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "substitute_attendance_substituteId_absenceId_key" ON "substitute_attendance"("substituteId", "absenceId");

-- CreateIndex
CREATE UNIQUE INDEX "period_configs_schoolId_label_key" ON "period_configs"("schoolId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "department_configs_schoolId_code_key" ON "department_configs"("schoolId", "code");

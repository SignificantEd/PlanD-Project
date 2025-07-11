-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_coverage_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "absenceId" TEXT NOT NULL,
    "assignedTeacherId" TEXT,
    "assignedSubstituteId" TEXT,
    "approvedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "period" TEXT NOT NULL,
    "subject" TEXT,
    "room" TEXT,
    "notes" TEXT,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coverage_assignments_absenceId_fkey" FOREIGN KEY ("absenceId") REFERENCES "absences" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "coverage_assignments_assignedTeacherId_fkey" FOREIGN KEY ("assignedTeacherId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "coverage_assignments_assignedSubstituteId_fkey" FOREIGN KEY ("assignedSubstituteId") REFERENCES "substitutes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "coverage_assignments_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_coverage_assignments" ("absenceId", "approvedById", "assignedAt", "assignedTeacherId", "confirmedAt", "createdAt", "id", "notes", "period", "room", "status", "subject", "updatedAt") SELECT "absenceId", "approvedById", "assignedAt", "assignedTeacherId", "confirmedAt", "createdAt", "id", "notes", "period", "room", "status", "subject", "updatedAt" FROM "coverage_assignments";
DROP TABLE "coverage_assignments";
ALTER TABLE "new_coverage_assignments" RENAME TO "coverage_assignments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

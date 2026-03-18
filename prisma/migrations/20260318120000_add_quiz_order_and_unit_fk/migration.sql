-- Add explicit order for quizzes within a unit
ALTER TABLE "quizzes"
ADD COLUMN "order" INTEGER;

-- Add FK so unitId keeps referential integrity with units
ALTER TABLE "quizzes"
ADD CONSTRAINT "quizzes_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "units"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Ensure no duplicated quiz order inside the same unit
CREATE UNIQUE INDEX "quizzes_unitId_order_key"
ON "quizzes"("unitId", "order");

-- Speed up course/unit filtering
CREATE INDEX "quizzes_courseId_unitId_idx"
ON "quizzes"("courseId", "unitId");

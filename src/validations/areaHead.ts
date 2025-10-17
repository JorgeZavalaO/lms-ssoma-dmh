import { z } from "zod"

export const AreaHeadAssignmentSchema = z.object({
  collaboratorId: z.string().min(1),
})
import { z } from "zod"

export const CourseAssignmentSchema = z.object({
  areas: z.array(z.string()).optional(),
  positions: z.array(z.string()).optional(),
  sites: z.array(z.string()).optional(),
  collaborators: z.array(z.string()).optional(),
})
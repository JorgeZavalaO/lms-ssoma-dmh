import { z } from "zod"

export const PositionSchema = z.object({
  name: z.string().min(2),
  areaId: z.string().min(1),
})
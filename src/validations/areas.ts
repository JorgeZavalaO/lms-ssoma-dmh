import { z } from "zod"

export const AreaSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
})
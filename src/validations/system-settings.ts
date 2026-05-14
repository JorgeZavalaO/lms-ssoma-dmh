import { z } from "zod"

export const CourseCompletionPolicySchema = z.object({
  bypassCourseCompletionRestrictions: z.boolean(),
})

export type CourseCompletionPolicyInput = z.infer<
  typeof CourseCompletionPolicySchema
>

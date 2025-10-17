import { z } from "zod"

export const CollaboratorSchema = z.object({
  dni: z.string().min(8).max(15),
  fullName: z.string().min(3),
  email: z.string().email(),
  siteCode: z.string().optional().nullable(),
  areaCode: z.string().optional().nullable(),
  positionName: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  entryDate: z.coerce.date(),
  // Nuevos campos para gestión de usuario
  createUser: z.boolean().optional().default(true),
  password: z.string().min(6).optional(),
  role: z.enum(["COLLABORATOR", "ADMIN", "SUPERADMIN"]).optional().default("COLLABORATOR"),
})
export type CollaboratorInput = z.infer<typeof CollaboratorSchema>

export const UpdateCollaboratorSchema = z.object({
  dni: z.string().min(8).max(15).optional(),
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),
  siteCode: z.string().optional().nullable(),
  areaCode: z.string().optional().nullable(),
  positionName: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  entryDate: z.coerce.date().optional(),
  // Nuevos campos para actualización de usuario
  updatePassword: z.boolean().optional().default(false),
  password: z.string().min(6).optional(),
  role: z.enum(["COLLABORATOR", "ADMIN", "SUPERADMIN"]).optional(),
})
export type UpdateCollaboratorInput = z.infer<typeof UpdateCollaboratorSchema>


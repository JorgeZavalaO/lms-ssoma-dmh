import { z } from "zod"

export const CollaboratorSchema = z.object({
  dni: z.string().min(8).max(15),
  fullName: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")),
  siteCode: z.string().optional().nullable(),
  areaCode: z.string().optional().nullable(),
  positionName: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  entryDate: z.coerce.date(),
  // Nuevos campos para gestión de usuario
  createUser: z.boolean().optional().default(true),
  password: z.string().min(6, "La contraseña debe tener mínimo 6 caracteres").or(z.literal("")).optional(),
  role: z.enum(["COLLABORATOR", "ADMIN", "SUPERADMIN"]).optional().default("COLLABORATOR"),
}).refine(
  (data) => {
    // Si hay password, debe tener email para crear usuario
    if (data.password && data.password.length >= 6) {
      return data.email && data.email.length > 0
    }
    return true
  },
  {
    message: "El email es obligatorio cuando se proporciona contraseña",
    path: ["email"],
  }
).refine(
  (data) => {
    // Si createUser es true y hay email, password es requerido
    if (data.createUser === true && data.email && data.email.length > 0) {
      return data.password && data.password.length >= 6
    }
    return true
  },
  {
    message: "La contraseña es obligatoria cuando se crea usuario con email",
    path: ["password"],
  }
)
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
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(["COLLABORATOR", "ADMIN", "SUPERADMIN"]).optional(),
})
export type UpdateCollaboratorInput = z.infer<typeof UpdateCollaboratorSchema>


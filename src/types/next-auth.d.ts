import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role: "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
    collaboratorId?: string | null
  }
  interface Session {
    user: {
      id: string
      role: "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
      collaboratorId?: string | null
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string
    role?: "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
    collaboratorId?: string | null
  }
}

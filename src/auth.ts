import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import authConfig from "@/auth.config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "dni-or-email",
      credentials: {
        identifier: { label: "DNI o correo", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        if (!creds?.identifier || !creds?.password) return null
        const identifier = (creds.identifier as string).trim()
        const password = creds.password as string
        if (!identifier) return null

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              {
                email: {
                  equals: identifier,
                  mode: "insensitive",
                },
              },
              {
                collaborator: {
                  is: {
                    dni: identifier,
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            collaboratorId: true,
            hashedPassword: true,
          },
        })

        if (!user?.hashedPassword) return null
        const hashedPassword = user.hashedPassword as string
        const ok = await bcrypt.compare(password, hashedPassword)
        if (!ok) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          collaboratorId: user.collaboratorId,
        }
      },
    }),
  ],
})

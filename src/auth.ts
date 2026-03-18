import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
// import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
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
        })

        if (!user?.hashedPassword) return null
        const hashedPassword = user.hashedPassword as string
        const ok = await bcrypt.compare(password, hashedPassword)
        return ok ? user : null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        // Obtener collaboratorId al crear el token
        if (user.role === "COLLABORATOR") {
          const userWithCollaborator = await prisma.user.findUnique({
            where: { id: user.id },
            select: { collaboratorId: true },
          })
          token.collaboratorId = userWithCollaborator?.collaboratorId
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as "SUPERADMIN" | "ADMIN" | "COLLABORATOR"
      if (token.collaboratorId) {
        session.user.collaboratorId = token.collaboratorId as string
      }
      return session
    },
  },
})

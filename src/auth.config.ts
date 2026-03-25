import type { NextAuthConfig } from "next-auth"

const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.collaboratorId = user.collaboratorId ?? null
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? ""
        session.user.role =
          (token.role as "SUPERADMIN" | "ADMIN" | "COLLABORATOR") ??
          "COLLABORATOR"
        session.user.collaboratorId =
          (token.collaboratorId as string | null | undefined) ?? null
      }

      return session
    },
  },
} satisfies NextAuthConfig

export default authConfig

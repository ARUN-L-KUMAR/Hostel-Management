import { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    permissions?: string[]
  }
  interface Session {
    user: {
      id: string
      role: string
      permissions?: string[]
    } & User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    permissions?: string[]
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          console.log("[AUTH] User authenticated:", {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as string[]
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
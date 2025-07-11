import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    role: string
    schoolId: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      schoolId: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    schoolId: string
  }
} 
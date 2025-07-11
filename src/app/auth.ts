import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Hardcoded test user - in production, this would come from a database
const TEST_USER = {
  id: "1",
  email: "admin@school.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password123"
  name: "School Administrator",
  role: "admin",
  schoolId: "1"
}

const handler = NextAuth({
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

        // Check if it's our test user
        if (credentials.email === TEST_USER.email) {
          const isValidPassword = await bcrypt.compare(credentials.password, TEST_USER.password)
          
          if (isValidPassword) {
            return {
              id: TEST_USER.id,
              email: TEST_USER.email,
              name: TEST_USER.name,
              role: TEST_USER.role,
              schoolId: TEST_USER.schoolId
            }
          }
        }

        return null
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.schoolId = user.schoolId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"
})

export { handler as GET, handler as POST }

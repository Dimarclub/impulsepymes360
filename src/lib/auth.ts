import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 días
  pages: {
    // No usamos página de login dedicada; el login se hace via dialog en /
    signIn: '/',
  },
  // En producción (Vercel) usar cookies seguras; en dev local no
  useSecureCookies: process.env.NODE_ENV === 'production',
  providers: [
    CredentialsProvider({
      name: 'Dimarclub',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        // Aceptar contraseña legacy en texto plano (seed) o hasheada con bcrypt
        let valid = false
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
          valid = await bcrypt.compare(credentials.password, user.password)
        } else {
          valid = user.password === credentials.password
        }
        if (!valid) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Permite redirects relativos y la URL base correcta
      // Evita redirigir a localhost cuando estamos en Vercel
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Si la URL es del mismo origen, permite el redirect
      const baseUrlObj = new URL(baseUrl)
      const urlObj = new URL(url)
      if (urlObj.origin === baseUrlObj.origin) {
        return url
      }
      // Default: vuelve al baseUrl (donde está el portal)
      return baseUrl
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Tipos extendidos para session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
  interface User {
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
  }
}

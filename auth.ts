import NextAuth, { CredentialsSignin, NextAuthConfig } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import prisma from "./lib/db";
import { loginSchema } from "./lib/zodSchema";
// import { role as Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id?: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
  }
}

export class CustomError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/en/login",
    signOut: "/en/signout",
  },
  callbacks: {
    authorized: async ({ auth, request: { nextUrl } }) => {
      const { pathname } = nextUrl;

      // Supported languages
      const languages = ["en", "am", "or"];

      // Extract language from pathname
      const langMatch = pathname.match(/^\/(en|am|or)/);
      const lang = langMatch ? langMatch[1] : "en";

      // If logged-in user hits login or signup, send to dashboard
      if (
        auth &&
        (pathname.includes("/login") || pathname.includes("/signup"))
      ) {
        return Response.redirect(new URL(`/${lang}/dashboard`, nextUrl));
      }

      // Public pages accessible without login (for all languages)
      const publicPaths = [
        "/about",
        "/login",
        "/signup",
        "/forgetPassword",
        "/service", // Guest service pages
      ];

      // Check if pathname matches any public path for any language
      const isPublicPath =
        languages.some((l) => {
          return publicPaths.some((p) => {
            // Check for exact match or path starts with public path
            return (
              pathname === `/${l}${p}` || pathname.startsWith(`/${l}${p}/`)
            );
          });
        }) ||
        pathname === "/" ||
        pathname.startsWith("/api/");

      if (isPublicPath) {
        return true;
      }

      // Protect all other routes that require authentication
      if (!auth && languages.some((l) => pathname.startsWith(`/${l}/`))) {
        return false; // NextAuth will redirect to pages.signIn
      }

      return true;
    },

    jwt: async ({ token, user }) => {
      return { ...token, ...user };
    },
    session: async ({ session, token }) => {
      return { ...session, user: { ...session.user, ...token } };
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const { username, password } = await loginSchema.parseAsync(
          credentials
        );
        const user = await prisma.user.findFirst({
          where: { username },
          select: {
            id: true,
            role: {
              select: {
                name: true,
              },
            },
            password: true,
            isActive: true,
          },
        });
        if (!user) throw new CustomError("Invalid Username");
        if (!user.password) throw new CustomError("Password Not Set");
        if (!user.isActive)
          throw new CustomError(
            "Account Blocked - Your account has been blocked. Please contact administrator."
          );
        if (!(await bcryptjs.compare(password, user.password)))
          throw new CustomError("Invalid Password");
        return { id: user.id, role: user.role?.name || "" };
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

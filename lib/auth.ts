import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { demoWorkspace } from "@/lib/data/demo";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const demoUsers = [
  {
    id: "user-owner",
    name: "Olivia Carter",
    email: "owner@demo.com",
    password: process.env.DEMO_USER_PASSWORD ?? "demo1234",
    role: "Owner",
  },
  {
    id: "user-analyst",
    name: "Marcus Lee",
    email: "analyst@demo.com",
    password: process.env.DEMO_USER_PASSWORD ?? "demo1234",
    role: "Analyst",
  },
];

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Demo login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = demoUsers.find(
          (candidate) =>
            candidate.email === parsed.data.email && candidate.password === parsed.data.password,
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: demoWorkspace.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.workspaceId = user.workspaceId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "demo-user";
        session.user.role = typeof token.role === "string" ? token.role : "Owner";
        session.user.workspaceId =
          typeof token.workspaceId === "string" ? token.workspaceId : demoWorkspace.id;
      }

      return session;
    },
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return session.user;
  }

  return {
    id: "demo-user",
    name: demoUsers[0].name,
    email: demoUsers[0].email,
    role: demoUsers[0].role,
    workspaceId: demoWorkspace.id,
  };
}

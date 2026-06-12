import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "ANALYST" | "VIEWER";
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (env.DATABASE_URL && userId) {
    try {
      const member = await prisma.workspaceMember.findFirst({
        where: { userId },
        include: { user: true },
      });
      if (member) {
        return {
          id: member.user.id,
          email: member.user.email,
          name: member.user.name,
          role: member.role,
        };
      }
    } catch {
      // Fall back to the mock owner for local/demo environments.
    }
  }

  return {
    id: "mock-owner",
    email: "owner@example.com",
    name: "Avery Morgan",
    role: "OWNER",
  };
}

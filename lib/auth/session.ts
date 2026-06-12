import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

const SESSION_COOKIE = "ads-intel-session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-auth-secret-change-in-production"
);

export interface SessionPayload {
  userId: string;
  workspaceId: string;
  email: string;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: { workspace: true },
      },
    },
  });
}

export async function requireWorkspaceAccess(workspaceId: string, minRole?: string) {
  const session = await requireSession();
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.userId,
      },
    },
  });

  if (!membership) throw new Error("Forbidden");

  const roleHierarchy = ["VIEWER", "ANALYST", "ADMIN", "OWNER"];
  if (minRole) {
    const userLevel = roleHierarchy.indexOf(membership.role);
    const requiredLevel = roleHierarchy.indexOf(minRole);
    if (userLevel < requiredLevel) throw new Error("Insufficient permissions");
  }

  return membership;
}

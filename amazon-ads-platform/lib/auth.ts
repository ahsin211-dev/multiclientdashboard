import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function validateUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function getUserWorkspace(userId: string) {
  const membership = await db.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspace ?? null;
}

export async function createUserWithWorkspace(
  email: string,
  name: string,
  password: string,
  workspaceName: string
) {
  const passwordHash = await hashPassword(password);
  const slug = workspaceName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    + "-" + Math.random().toString(36).slice(2, 7);

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name, passwordHash },
    });
    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });
    return { user, workspace };
  });
}

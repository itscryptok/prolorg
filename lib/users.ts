import type { PrismaClient } from "@prisma/client";

// Narrow typed delegates for the Big/MVP tables (the generated Prisma
// client in dev is stale; production regenerates it at build time).

export type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string | null;
  isBlocked: boolean;
  createdAt: Date;
};

export type UserDelegate = {
  findUnique(args: {
    where: { email: string } | { id: string };
    select?: Record<string, boolean>;
  }): Promise<UserRow | null>;
  create(args: {
    data: { email: string; name: string; role: string; passwordHash: string };
    select?: Record<string, boolean>;
  }): Promise<UserRow>;
  update(args: {
    where: { id: string };
    data: { isBlocked?: boolean };
  }): Promise<UserRow>;
  findMany(args?: {
    where?: { isBlocked?: boolean };
    orderBy?: { createdAt: "desc" | "asc" };
    take?: number;
    select?: Record<string, boolean>;
  }): Promise<UserRow[]>;
};

export function users(db: PrismaClient): UserDelegate {
  return (db as unknown as { user: UserDelegate }).user;
}

export const PUBLIC_USER = { id: true, email: true, name: true, role: true };

export function publicUser(u: UserRow) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

import type { PrismaClient } from "@prisma/client";

// Narrow typed delegates for the Big/MVP inbox tables (the generated Prisma
// client in dev is stale; production regenerates it at build time).

export type ConversationRow = {
  id: string;
  clientId: string;
  expertId: string;
  unlockedContact: boolean;
  createdAt: Date;
};

export type ConversationDelegate = {
  findFirst(args: { where: Record<string, unknown> }): Promise<ConversationRow | null>;
  findUnique(args: { where: Record<string, unknown> }): Promise<ConversationRow | null>;
  findMany(args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }): Promise<ConversationRow[]>;
  create(args: { data: { clientId: string; expertId: string } }): Promise<ConversationRow>;
};

export type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  flagged: boolean;
  createdAt: Date;
};

export type MessageDelegate = {
  findMany(args: {
    where: Record<string, unknown>;
    orderBy: { createdAt: "asc" | "desc" };
    take?: number;
  }): Promise<MessageRow[]>;
  create(args: {
    data: { conversationId: string; senderId: string; body: string; flagged: boolean };
  }): Promise<MessageRow>;
};

export type HireRow = {
  id: string;
  conversationId: string;
  scope: string;
  price: number;
  agreement: string | null;
  status: string;
  createdAt: Date;
};

export type HireDelegate = {
  findFirst(args: { where: Record<string, unknown> }): Promise<HireRow | null>;
  findMany(args: {
    where: Record<string, unknown>;
    orderBy: { createdAt: "desc" | "asc" };
  }): Promise<HireRow[]>;
  findUnique(args: { where: { id: string } }): Promise<HireRow | null>;
  create(args: {
    data: { conversationId: string; scope: string; price: number; agreement: string | null; status: string };
  }): Promise<HireRow>;
  update(args: { where: { id: string }; data: { status: string } }): Promise<HireRow>;
};

export type ReviewRow = {
  id: string;
  hireRequestId: string;
  authorId: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

export type ReviewDelegate = {
  findFirst(args: { where: Record<string, unknown> }): Promise<ReviewRow | null>;
  create(args: {
    data: { hireRequestId: string; authorId: string; rating: number; comment: string | null };
  }): Promise<ReviewRow>;
};

export type ViolationRow = {
  id: string;
  userId: string;
  conversationId: string | null;
  messageId: string | null;
  reasons: string;
  excerpt: string;
  createdAt: Date;
};

export type ViolationDelegate = {
  create(args: {
    data: {
      userId: string;
      conversationId: string | null;
      messageId: string | null;
      reasons: string;
      excerpt: string;
    };
  }): Promise<unknown>;
  findMany(args: {
    orderBy: { createdAt: "desc" };
    take: number;
  }): Promise<ViolationRow[]>;
  count(args?: { where?: { userId: string } }): Promise<number>;
};

export type ExpertLinkRow = {
  id: string;
  userId: string | null;
  slug: string;
  name: string;
  headline: string;
  status: string;
};

export type ExpertProfileDelegate = {
  findFirst(args: {
    where: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<ExpertLinkRow | null>;
  findUnique(args: { where: { id: string } }): Promise<ExpertLinkRow | null>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
};

type Delegates = {
  conversation: ConversationDelegate;
  message: MessageDelegate;
  hireRequest: HireDelegate;
  review: ReviewDelegate;
  violation: ViolationDelegate;
  expertProfile: ExpertProfileDelegate;
  $queryRawUnsafe(query: string, ...params: unknown[]): Promise<never>;
};

export function inbox(db: PrismaClient): Delegates {
  return db as unknown as Delegates;
}

// Raw SQL helper (keeps the Prisma `this` binding intact).
export async function raw<T>(db: PrismaClient, query: string, ...params: unknown[]): Promise<T[]> {
  return (db as unknown as { $queryRawUnsafe(q: string, ...p: unknown[]): Promise<T[]> }).$queryRawUnsafe(
    query,
    ...params
  );
}

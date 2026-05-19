import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { Pool } from "pg";

let _prisma: PrismaClient | null = null;
let _pool: Pool | null = null;

/** Lazy-initialised Prisma client — ensures DATABASE_URL is set before connecting. */
export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 3,
    });
    const adapter = new PrismaPg(_pool);
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
}

/**
 * Drop-in replacement: importing `prisma` still works everywhere in the worker,
 * but the connection is established on first use, not at import time.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});

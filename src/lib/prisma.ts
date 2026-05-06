import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDbUrl(): string {
  // Em ambiente serverless (Vercel), copia o DB para /tmp (única pasta gravável)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const src = path.join(process.cwd(), "prisma", "dev.db");
    const dst = "/tmp/dev.db";
    try {
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    } catch (e) {
      console.error("Failed to copy DB:", e);
    }
    return `file:${dst}`;
  }
  // Build / dev local: usa caminho absoluto para o dev.db dentro de /prisma
  const localDb = path.join(process.cwd(), "prisma", "dev.db");
  return `file:${localDb}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: getDbUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

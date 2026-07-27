import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { PrismaClient } from "@prisma/client";

type AuthFactoryOptions = {
  prisma: PrismaClient;
  secret: string;
  baseURL: string;
};

export function createAuth({
  prisma,
  secret,
  baseURL,
}: AuthFactoryOptions) {
  return betterAuth({
    appName: "Ajai Docs",
    secret,
    baseURL,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });
}

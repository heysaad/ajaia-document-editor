import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { z } from "zod";

import { createAuth } from "../features/auth/server/auth-factory";
import { SEEDED_USERS } from "../features/auth/server/seeded-users";

const prisma = new PrismaClient();

const seedEnv = z
  .object({
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    DEMO_USER_PASSWORD: z.string().min(12).max(128),
  })
  .parse(process.env);

export async function seedUsers(client: PrismaClient = prisma) {
  const seedAuth = createAuth({
    prisma: client,
    secret: seedEnv.BETTER_AUTH_SECRET,
    baseURL: seedEnv.BETTER_AUTH_URL,
  });

  for (const demoUser of SEEDED_USERS) {
    const existingUser = await client.user.findUnique({
      where: { email: demoUser.email },
      include: {
        accounts: {
          where: { providerId: "credential" },
          select: { id: true, password: true },
        },
      },
    });

    if (existingUser) {
      const credential = existingUser.accounts[0];
      if (!credential?.password) {
        throw new Error(
          `Seeded user ${demoUser.email} exists without a password credential. Reset the clean assessment database before seeding again.`,
        );
      }

      continue;
    }

    await seedAuth.api.signUpEmail({
      body: {
        name: demoUser.name,
        email: demoUser.email,
        password: seedEnv.DEMO_USER_PASSWORD,
      },
    });
  }
}

async function main() {
  await seedUsers();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

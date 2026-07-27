import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { SEEDED_USERS } from "@/features/auth/server/seeded-users";
import { seedUsers } from "@/prisma/seed";

const prisma = new PrismaClient();

describe("Better Auth seed", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("is idempotent and stores one hashed credential per demo user", async () => {
    await seedUsers(prisma);
    await seedUsers(prisma);

    const users = await prisma.user.findMany({
      where: {
        email: { in: SEEDED_USERS.map((user) => user.email) },
      },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    expect(users).toHaveLength(SEEDED_USERS.length);
    for (const user of users) {
      expect(user.accounts).toHaveLength(1);
      expect(user.accounts[0].password).toBeTruthy();
      expect(user.accounts[0].password).not.toBe(
        process.env.DEMO_USER_PASSWORD,
      );
    }
  });
});

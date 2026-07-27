import { PrismaClient } from "@prisma/client";

import { SEEDED_USERS } from "../features/auth/server/seeded-users";

const prisma = new PrismaClient();

export async function seedUsers(client: PrismaClient = prisma) {
  await Promise.all(
    SEEDED_USERS.map((user) =>
      client.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
        },
        create: user,
      }),
    ),
  );
}

async function main() {
  await seedUsers();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

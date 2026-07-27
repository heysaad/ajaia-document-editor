import { PrismaClient } from "@prisma/client";

import { DEMO_USERS } from "../features/auth/server/demo-users";

const prisma = new PrismaClient();

export async function seedDemoUsers(client: PrismaClient = prisma) {
  await Promise.all(
    DEMO_USERS.map((user) =>
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
  await seedDemoUsers();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

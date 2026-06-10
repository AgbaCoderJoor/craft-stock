import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const roleNames = ["admin", "store_manager", "production_staff", "viewer"];
  for (const role_name of roleNames) {
    await prisma.role.upsert({
      where: { role_name },
      update: {},
      create: { role_name },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { role_name: "admin" } });
  if (!adminRole) throw new Error("Admin role not found after seeding.");

  await prisma.user.upsert({
    where: { email: "admin@craftstock.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@craftstock.com",
      password_hash: await bcrypt.hash("changeme123", 10),
      role_id: adminRole.role_id,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

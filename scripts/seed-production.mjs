import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const companyId = "default-company";
const userId = "demo-admin-user";
const email = "admin@arbcore.ai";
const password = "demo1234";

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const company = await prisma.company.upsert({
    where: { id: companyId },
    update: {
      name: "ARBCore AI",
      slug: "arbcore-ai",
      plan: "Enterprise"
    },
    create: {
      id: companyId,
      name: "ARBCore AI",
      slug: "arbcore-ai",
      plan: "Enterprise"
    }
  });

  await prisma.user.upsert({
    where: { email },
    update: {
      id: userId,
      name: "Rasel Ahmed",
      role: "OWNER",
      isActive: true,
      passwordHash,
      companyId: company.id
    },
    create: {
      id: userId,
      email,
      name: "Rasel Ahmed",
      role: "OWNER",
      isActive: true,
      passwordHash,
      companyId: company.id
    }
  });

  console.log("Production seed complete: ARBCore AI company and owner user are ready.");
}

main()
  .catch((error) => {
    console.error("Production seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

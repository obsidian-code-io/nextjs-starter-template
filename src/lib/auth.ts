import { prisma } from "@/lib/db";

export async function getSystemUser() {
  const email = "system@example.com";

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "System User",
      },
    });

    const org = await prisma.organization.create({
      data: {
        name: "Default Organization",
        code: "ORG-001",
      },
    });

    await prisma.organizationAccess.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        legacyRole: "ADMIN",
      },
    });
  }

  return user;
}

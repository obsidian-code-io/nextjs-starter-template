import { hash } from "argon2";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  await prisma.rolePermission.deleteMany();
  await prisma.organizationAccess.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.fileStorage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("✅ Cleared existing data");

  // Create Organizations
  const org1 = await prisma.organization.create({
    data: {
      id: "4161239b-4dd2-40d5-ac7f-dd6d317d11f5",
      name: "Acme Corporation",
      code: "ACME-001",
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      id: "d9421175-be94-4553-b288-3a9118fada20",
      name: "Test Organization",
      code: "TEST-001",
    },
  });

  console.log("✅ Created organizations");

  const adminPassword = await hash("Admin@123");

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash: adminPassword,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@example.com",
      name: "Manager User",
      passwordHash: adminPassword,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: "viewer@example.com",
      name: "Viewer User",
      passwordHash: adminPassword,
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: "test@test.com",
      name: "Test User",
      passwordHash: adminPassword,
    },
  });

  console.log("✅ Created users (password: Admin@123)");

  // Create permissions for resources
  const organizationPermission = await prisma.permission.create({
    data: {
      resource: "ORGANIZATION",
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    },
  });

  const userPermission = await prisma.permission.create({
    data: {
      resource: "USER",
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    },
  });

  // Create 5 generic roles
  const adminRole = await prisma.role.create({
    data: { name: "Admin", isCustom: false },
  });
  const managerRole = await prisma.role.create({
    data: { name: "Manager", isCustom: false },
  });
  const editorRole = await prisma.role.create({
    data: { name: "Editor", isCustom: false },
  });
  const viewerRole = await prisma.role.create({
    data: { name: "Viewer", isCustom: false },
  });
  const guestRole = await prisma.role.create({
    data: { name: "Guest", isCustom: false },
  });

  // Assign permissions to Admin role (full access)
  await prisma.rolePermission.createMany({
    data: [
      { roleId: adminRole.id, permissionId: organizationPermission.id },
      { roleId: adminRole.id, permissionId: userPermission.id },
    ],
  });

  // Assign permissions to Manager role (read/update, no create/delete)
  const managerOrgPermission = await prisma.permission.create({
    data: {
      resource: "ORGANIZATION",
      canCreate: false,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    },
  });
  const managerUserPermission = await prisma.permission.create({
    data: {
      resource: "USER",
      canCreate: false,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    },
  });
  await prisma.rolePermission.createMany({
    data: [
      { roleId: managerRole.id, permissionId: managerOrgPermission.id },
      { roleId: managerRole.id, permissionId: managerUserPermission.id },
    ],
  });

  // Assign permissions to Editor role (read/update, no create/delete)
  const editorOrgPermission = await prisma.permission.create({
    data: {
      resource: "ORGANIZATION",
      canCreate: false,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    },
  });
  const editorUserPermission = await prisma.permission.create({
    data: {
      resource: "USER",
      canCreate: false,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    },
  });
  await prisma.rolePermission.createMany({
    data: [
      { roleId: editorRole.id, permissionId: editorOrgPermission.id },
      { roleId: editorRole.id, permissionId: editorUserPermission.id },
    ],
  });

  // Assign permissions to Viewer role (read-only)
  const viewerOrgPermission = await prisma.permission.create({
    data: {
      resource: "ORGANIZATION",
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
    },
  });
  const viewerUserPermission = await prisma.permission.create({
    data: {
      resource: "USER",
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
    },
  });
  await prisma.rolePermission.createMany({
    data: [
      { roleId: viewerRole.id, permissionId: viewerOrgPermission.id },
      { roleId: viewerRole.id, permissionId: viewerUserPermission.id },
    ],
  });

  // Guest role has no permissions (already created, no permissions assigned)

  console.log("✅ Created 5 generic roles with permissions");

  // Create Organization Access
  await prisma.organizationAccess.createMany({
    data: [
      {
        userId: adminUser.id,
        organizationId: org1.id,
        roleId: adminRole.id,
      },
      {
        userId: managerUser.id,
        organizationId: org1.id,
        roleId: managerRole.id,
      },
      {
        userId: viewerUser.id,
        organizationId: org1.id,
        roleId: viewerRole.id,
      },
      {
        userId: testUser.id,
        organizationId: org2.id,
        roleId: adminRole.id,
      },
    ],
  });

  console.log("✅ Created organization access");

  console.log("\n✨ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("- 2 Organizations (Acme Corporation, Test Organization)");
  console.log(
    "- 4 Users (admin@example.com, manager@example.com, viewer@example.com, test@test.com)",
  );
  console.log("- Password for all users: Admin@123");
  console.log("- 5 Generic Roles (Admin, Manager, Editor, Viewer, Guest)");
  console.log("- Roles assigned with appropriate permissions");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

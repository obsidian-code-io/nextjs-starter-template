import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as {
      name?: string;
      permissions?: Array<{
        resource: string;
        canCreate?: boolean;
        canRead?: boolean;
        canUpdate?: boolean;
        canDelete?: boolean;
      }>;
    };
    const { name, permissions } = body;

    // Update role name if provided
    if (name) {
      await prisma.role.update({
        where: { id },
        data: { name },
      });
    }

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Create new permissions and link them
      for (const perm of permissions) {
        const { resource, canCreate, canRead, canUpdate, canDelete } = perm;

        const permission = await prisma.permission.create({
          data: {
            resource,
            canCreate: canCreate || false,
            canRead: canRead || false,
            canUpdate: canUpdate || false,
            canDelete: canDelete || false,
          },
        });

        await prisma.rolePermission.create({
          data: {
            roleId: id,
            permissionId: permission.id,
          },
        });
      }
    }

    // Fetch the updated role
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if role is in use
    const inUse = await prisma.organizationAccess.findFirst({
      where: { roleId: id },
    });

    if (inUse) {
      return NextResponse.json(
        { error: "Cannot delete role that is assigned to users" },
        { status: 400 },
      );
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Delete the role
    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}

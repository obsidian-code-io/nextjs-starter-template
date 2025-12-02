import { prisma } from "@/lib/db";

export async function hasPermission(
  userId: string,
  organizationId: string,
  resource: string,
  action: "C" | "R" | "U" | "D",
): Promise<boolean> {
  const orgAccess = await prisma.organizationAccess.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!orgAccess) {
    return false;
  }

  // If user has a custom role, check its permissions
  if (orgAccess.role) {
    const rolePermissions = orgAccess.role.permissions;

    for (const rp of rolePermissions) {
      const perm = rp.permission;
      if (perm.resource === resource) {
        switch (action) {
          case "C":
            return perm.canCreate;
          case "R":
            return perm.canRead;
          case "U":
            return perm.canUpdate;
          case "D":
            return perm.canDelete;
        }
      }
    }
    return false;
  }

  // Fall back to legacy role permissions
  const legacyRole = orgAccess.legacyRole;

  // SuperAdmin-like legacy roles (ADMIN) have all permissions
  if (legacyRole === "ADMIN") {
    return true;
  }

  // MANAGER has full permissions for all resources
  if (legacyRole === "MANAGER") {
    return true;
  }

  // EDITOR has create, read, update permissions (no delete)
  if (legacyRole === "EDITOR" && action !== "D") {
    return true;
  }

  // VIEWER has read-only access
  if (legacyRole === "VIEWER" && action === "R") {
    return true;
  }

  // GUEST has no permissions
  if (legacyRole === "GUEST") {
    return false;
  }

  return false;
}

/**
 * Require a specific permission or throw an error
 * @param userId - The user's ID
 * @param organizationId - The organization ID
 * @param resource - The resource name
 * @param action - The action to check
 * @throws Error if permission is denied
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  resource: string,
  action: "C" | "R" | "U" | "D",
): Promise<void> {
  const allowed = await hasPermission(userId, organizationId, resource, action);
  if (!allowed) {
    throw new Error(`Permission denied: ${action} on ${resource}`);
  }
}

/**
 * Get all permissions for a user in an organization
 * @param userId - The user's ID
 * @param organizationId - The organization ID
 * @returns Promise<Record<string, { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }>>
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string,
): Promise<
  Record<
    string,
    {
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    }
  >
> {
  const orgAccess = await prisma.organizationAccess.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!orgAccess) {
    return {};
  }

  const permissions: Record<
    string,
    {
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    }
  > = {};

  // If user has a custom role, use its permissions
  if (orgAccess.role) {
    for (const rp of orgAccess.role.permissions) {
      const perm = rp.permission;
      permissions[perm.resource] = {
        canCreate: perm.canCreate,
        canRead: perm.canRead,
        canUpdate: perm.canUpdate,
        canDelete: perm.canDelete,
      };
    }
  } else {
    // Fall back to legacy role permissions
    const legacyRole = orgAccess.legacyRole;

    if (legacyRole === "ADMIN") {
      permissions["ORGANIZATION"] = {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
      permissions["USER"] = {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    } else if (legacyRole === "MANAGER") {
      permissions["ORGANIZATION"] = {
        canCreate: false,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      };
      permissions["USER"] = {
        canCreate: false,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      };
    } else if (legacyRole === "EDITOR") {
      permissions["ORGANIZATION"] = {
        canCreate: false,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      };
      permissions["USER"] = {
        canCreate: false,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      };
    } else if (legacyRole === "VIEWER") {
      permissions["ORGANIZATION"] = {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      };
      permissions["USER"] = {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      };
    } else if (legacyRole === "GUEST") {
      // GUEST has no permissions
    }
  }

  return permissions;
}

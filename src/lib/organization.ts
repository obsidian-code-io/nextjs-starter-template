import { cookies } from "next/headers";

export async function getOrganizationId() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get("organizationId")?.value;
  return orgId;
}

export async function requireOrganization() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    throw new Error("Organization ID is required");
  }
  return orgId;
}

import { getCurrentOrganization } from "@/app/actions/organization";
import { OrganizationForm } from "./organization-form";

export default async function SettingsPage() {
  const organization = await getCurrentOrganization();

  return (
    <div className="space-y-6">
      {organization && (
        <section>
          <OrganizationForm organization={organization} />
        </section>
      )}
    </div>
  );
}

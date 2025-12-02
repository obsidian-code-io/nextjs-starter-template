import { getCurrentUser } from "@/app/actions/user";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile information and password
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileForm user={user} />
        <PasswordForm />
      </div>
    </div>
  );
}

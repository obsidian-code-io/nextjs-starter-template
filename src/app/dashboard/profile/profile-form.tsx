"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateProfile } from "@/app/actions/auth";
import { Upload, User } from "lucide-react";
import Image from "next/image";

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    profilePictureUrl?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [profilePreview, setProfilePreview] = useState<string | null>(
    user.profilePictureUrl || null,
  );
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const initialState: { error?: any; success?: boolean } = {};
  const [state, formAction] = useActionState(updateProfile, initialState);

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your name and profile picture</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name || ""}
              required
            />
            {state?.error?.name && (
              <p className="text-sm text-destructive">{state.error.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="flex items-center gap-4">
              {profilePreview && (
                <div className="relative h-20 w-20 rounded-full overflow-hidden border">
                  <Image
                    src={profilePreview}
                    alt="Profile picture"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {!profilePreview && (
                <div className="h-20 w-20 rounded-full border flex items-center justify-center bg-muted">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="profilePicture"
                  name="profilePictureFile"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a new profile picture (PNG, JPG, or SVG)
                </p>
              </div>
            </div>
          </div>

          {state?.error?.root && (
            <p className="text-sm text-destructive">{state.error.root}</p>
          )}

          {state?.success && (
            <p className="text-sm text-green-600">
              Profile updated successfully!
            </p>
          )}

          <Button type="submit" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Update Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

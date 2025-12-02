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
import {
  updateOrganization,
  getCurrentOrganization,
} from "@/app/actions/organization";
import { Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface OrganizationFormProps {
  organization: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization.logoUrl || null,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const initialState: { error?: any; success?: boolean } = {};
  const updateOrgAction = updateOrganization.bind(null, organization.id);
  const [state, formAction] = useActionState(updateOrgAction, initialState);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
        <CardDescription>
          Update your organization name and logo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={organization.name}
              required
            />
            {state?.error?.name && (
              <p className="text-sm text-destructive">{state.error.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                  <Image
                    src={logoPreview}
                    alt="Organization logo"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  name="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a new logo (PNG, JPG, or SVG)
                </p>
              </div>
            </div>
          </div>

          {state?.error?.root && (
            <p className="text-sm text-destructive">{state.error.root}</p>
          )}

          {state?.success && (
            <p className="text-sm text-green-600">
              Organization updated successfully!
            </p>
          )}

          <Button type="submit" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Update Organization
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

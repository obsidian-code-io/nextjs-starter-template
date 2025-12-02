"use client";

import { useActionState } from "react";
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
import { changePassword } from "@/app/actions/auth";
import { Lock } from "lucide-react";

export function PasswordForm() {
  const initialState: { error?: any; success?: boolean } = {};
  const [state, formAction] = useActionState(changePassword, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
            />
            {state?.error?.currentPassword && (
              <p className="text-sm text-destructive">
                {state.error.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
            />
            {state?.error?.newPassword && (
              <p className="text-sm text-destructive">
                {state.error.newPassword}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
            />
            {state?.error?.confirmPassword && (
              <p className="text-sm text-destructive">
                {state.error.confirmPassword}
              </p>
            )}
          </div>

          {state?.error?.root && (
            <p className="text-sm text-destructive">{state.error.root}</p>
          )}

          {state?.success && (
            <p className="text-sm text-green-600">
              Password changed successfully!
            </p>
          )}

          <Button type="submit" className="w-full">
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account..." : "Sign up"}
    </Button>
  );
}

const initialState: { error?: Record<string, string[]> } = {};

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" action={formAction}>
            <div className="space-y-4 rounded-md">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="mt-1"
                />
                {state?.error?.name && (
                  <p className="text-sm text-red-500">{state.error.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1"
                />
                {state?.error?.email && (
                  <p className="text-sm text-red-500">{state.error.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1"
                />
                {state?.error?.password && (
                  <p className="text-sm text-red-500">{state.error.password}</p>
                )}
              </div>
            </div>

            {state?.error?.root && (
              <p className="text-sm text-red-500 text-center">
                {state.error.root}
              </p>
            )}

            <div>
              <SubmitButton />
            </div>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}

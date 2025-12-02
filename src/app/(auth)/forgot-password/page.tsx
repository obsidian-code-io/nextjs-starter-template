"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/auth";
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
      {pending ? "Sending..." : "Send Reset Link"}
    </Button>
  );
}

const initialState: { error?: string; success?: string } = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPassword, initialState);

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>
          <form className="mt-8 space-y-6" action={formAction}>
            <div className="space-y-4 rounded-md ">
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
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-500 text-center">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-green-500 text-center">
                {state.success}
              </p>
            )}

            <div>
              <SubmitButton />
            </div>
            <div className="text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Create Account - AssetFlow",
  description: "Create your AssetFlow account",
};

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground lg:hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Package className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">AssetFlow</span>
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Get started with AssetFlow in seconds
          </p>
        </div>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

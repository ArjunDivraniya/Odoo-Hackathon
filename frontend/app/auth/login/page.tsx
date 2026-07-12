import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In - AssetFlow",
  description: "Sign in to your AssetFlow account",
};

export default function LoginPage() {
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
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-primary hover:underline transition-colors"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

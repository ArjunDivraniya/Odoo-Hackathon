import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password - AssetFlow",
  description: "Reset your AssetFlow password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset
          your password.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email - AssetFlow",
  description: "Verify your email address",
};

export default function VerifyEmailPage() {
  return (
    <div className="space-y-8">
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}

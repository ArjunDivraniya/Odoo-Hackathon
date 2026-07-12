"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyEmail } from "../hooks/use-auth";
import {
  verifyEmailSchema,
  type VerifyEmailFormData,
} from "../validation/auth.schema";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const verifyEmailMutation = useVerifyEmail();
  const hasSubmittedRef = useRef(false);

  const {
    register,
    handleSubmit,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token },
  });

  const onSubmit = (data: VerifyEmailFormData) => {
    verifyEmailMutation.mutate(data);
  };

  useEffect(() => {
    if (token && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      verifyEmailMutation.mutate({ token });
    }
  }, [token, verifyEmailMutation]);

  if (verifyEmailMutation.isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Email Verified</h3>
          <p className="text-sm text-muted-foreground">
            Your email has been verified. You can now sign in to your account.
          </p>
        </div>
        <Link href="/auth/login">
          <Button className="w-full mt-4">Sign In</Button>
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Verify Your Email</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to your email address. Please
            check your inbox and click the link to verify your account.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            create a new account
          </Link>
        </p>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full mt-4">
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (verifyEmailMutation.isPending) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Verifying Email</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("token")} />

      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Email Verification</h3>
        <p className="text-sm text-muted-foreground">
          Click the button below to verify your email address.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={verifyEmailMutation.isPending}
      >
        {verifyEmailMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Email"
        )}
      </Button>

      <Link href="/auth/login">
        <Button variant="ghost" className="w-full">
          Back to Sign In
        </Button>
      </Link>
    </form>
  );
}

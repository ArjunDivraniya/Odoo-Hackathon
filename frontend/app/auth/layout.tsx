import type { Metadata } from "next";
import { Package } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AssetFlow - Authentication",
  description: "Enterprise Asset & Resource Management System",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Package className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">AssetFlow</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Enterprise Asset &<br />
              Resource Management
            </h1>
            <p className="text-lg text-slate-300 max-w-md leading-relaxed">
              Streamline your organization&apos;s asset lifecycle with
              intelligent tracking, automated workflows, and real-time
              analytics.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-white">50K+</p>
                <p className="text-sm text-slate-400">Assets Managed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">200+</p>
                <p className="text-sm text-slate-400">Enterprises</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-sm text-slate-400">Uptime</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AssetFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

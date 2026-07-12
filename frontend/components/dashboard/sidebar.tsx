"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Settings,
  Users,
  Building2,
  Shield,
  Bell,
  HelpCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assets", href: "/dashboard/assets", icon: Package },
  { label: "Allocations", href: "/dashboard/allocations", icon: ArrowLeftRight },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Audits", href: "/dashboard/audits", icon: ClipboardCheck },
];

const managementNavItems: NavItem[] = [
  { label: "Departments", href: "/dashboard/departments", icon: Building2 },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Roles & Permissions", href: "/dashboard/roles", icon: Shield },
];

const bottomNavItems: NavItem[] = [
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole = user?.roles?.[0]?.role?.name?.toLowerCase();

  const canSeeManagement =
    userRole === "admin" || userRole === "super_admin";

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
          <Package className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold tracking-tight">AssetFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Main
        </p>
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {canSeeManagement && (
          <>
            <p className="px-3 mt-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Management
            </p>
            {managementNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}

        <div className="mt-6 pt-4 border-t border-border space-y-1">
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Support
          </p>
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

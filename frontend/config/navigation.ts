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
  PieChart,
  Activity,
} from "lucide-react";
import React from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: PieChart },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Allocations", href: "/allocations", icon: ArrowLeftRight },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Audits", href: "/audits", icon: ClipboardCheck },
];

export const managementNavItems: NavItem[] = [
  { label: "Organization Setup", href: "/organization", icon: Building2, roles: ["admin", "super_admin"] },
  { label: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "super_admin"] },
  { label: "Roles & Permissions", href: "/roles", icon: Shield, roles: ["super_admin"] },
];

export const bottomNavItems: NavItem[] = [
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
];

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Package,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  Users,
  Building2,
  BarChart3,
  Shield,
  Bell,
  HelpCircle,
} from "lucide-react";

const mobileNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assets", href: "/dashboard/assets", icon: Package },
  { label: "Allocations", href: "/dashboard/allocations", icon: ArrowLeftRight },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Audits", href: "/dashboard/audits", icon: ClipboardCheck },
  { label: "Departments", href: "/dashboard/departments", icon: Building2 },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Roles & Permissions", href: "/dashboard/roles", icon: Shield },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  const roleName = user?.roles?.[0]?.role?.name || "Employee";
  const department = user?.employeeProfile?.department?.name;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6">
      {/* Mobile menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex items-center justify-center lg:hidden"
          render={<Button variant="ghost" size="icon" />}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">AssetFlow</span>
          </div>
          <nav className="py-4 px-3 space-y-1">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* User menu */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {roleName}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-full cursor-pointer">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              {department && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {department}
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/dashboard/profile" className="cursor-pointer" />}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href="/dashboard/settings" className="cursor-pointer" />}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive"
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

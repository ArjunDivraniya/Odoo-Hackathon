"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Fragment } from "react";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDashboardNotifications } from "@/hooks/use-dashboard";
import { NotificationItem } from "@/components/ui/notification-component";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mainNavItems, managementNavItems, bottomNavItems } from "@/config/navigation";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  User,
  Settings,
  LogOut,
  Package,
  Bell,
  Search,
  Sun,
  Moon,
  Globe,
  ChevronRight,
  Building2,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: notifications } = useDashboardNotifications();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  // Parse custom claims
  const roleName = user?.roles?.[0]?.role?.name?.replace(/_/g, " ") || "User";
  const department = user?.employeeProfile?.department?.name;

  // Generate dynamic breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(p => p);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSegments.length - 1;
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { title, href, isLast };
  });

  const allNavItems = [...mainNavItems, ...managementNavItems, ...bottomNavItems];

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
      
      {/* Mobile Sidebar Toggle */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col h-full bg-card">
          <SheetHeader className="px-6 py-4 border-b border-border text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Package className="h-4 w-4" />
              </div>
              <SheetTitle className="text-lg font-bold tracking-tight">AssetFlow</SheetTitle>
            </div>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {allNavItems.map((item) => (
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

      {/* Dynamic Breadcrumbs (Hidden on mobile) */}
      <div className="hidden md:flex items-center flex-1 min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbItems.map((item, index) => (
              <Fragment key={item.href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.title}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 md:flex-none" />

      {/* Navbar Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Global Search */}
        <div className="relative hidden lg:block w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search assets, users..." 
            className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1"
          />
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0 text-muted-foreground">
          <Search className="h-5 w-5" />
        </Button>

        {/* Language Switcher Placeholder */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hidden sm:flex">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem className="cursor-pointer">English (US)</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Español</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Français</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hidden sm:flex">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Drawer */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors cursor-pointer">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {notifications?.some(n => !n.read) && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border-2 border-background">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[380px] p-0 border border-border/50 shadow-xl" align="end" sideOffset={8}>
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
              <span className="font-semibold text-sm">Notifications</span>
              <Link href="/dashboard/activity" className="text-xs text-primary hover:underline font-medium">
                View all
              </Link>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
              {notifications?.length ? notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="p-1">
                  <NotificationItem
                    id={n.id}
                    title={n.title}
                    message={n.message}
                    timestamp={n.timestamp}
                    isRead={n.read}
                  />
                </div>
              )) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex items-center gap-2 rounded-full cursor-pointer hover:bg-accent p-1 pr-3 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start min-w-[80px]">
              <span className="text-sm font-medium leading-none mb-1">{user?.firstName}</span>
              <span className="text-[10px] text-muted-foreground leading-none capitalize">{roleName}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 mt-1" align="end">
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Acme Corp Ltd.</p>
                <p className="text-xs text-muted-foreground truncate">{department || "Operations"}</p>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer flex items-center p-2">
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">My Profile</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer flex items-center p-2">
                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Account Settings</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={logout} className="cursor-pointer flex items-center p-2 text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-3 h-4 w-4" />
              <span className="flex-1">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}

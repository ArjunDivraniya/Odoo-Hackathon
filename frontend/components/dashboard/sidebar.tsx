"use client";

import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";
import { SidebarItem } from "@/components/dashboard/sidebar-item";
import { motion } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavItem, mainNavItems, managementNavItems, bottomNavItems } from "@/config/navigation";

export function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebar();
  
  const userRole = user?.roles?.[0]?.role?.name?.toLowerCase() || "user";

  const filterNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(userRole);
    });
  };

  const allowedManagement = filterNavItems(managementNavItems);

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isCollapsed ? 80 : 256 
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex lg:flex-col lg:border-r border-border bg-card h-screen sticky top-0 overflow-hidden shrink-0"
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border shrink-0 min-w-[256px]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background shrink-0">
          <Package className="h-4 w-4" />
        </div>
        <motion.span 
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="text-lg font-bold tracking-tight"
        >
          AssetFlow
        </motion.span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
        
        {/* Main Section */}
        <motion.p 
          animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : "auto", marginBottom: isCollapsed ? 0 : 8 }}
          className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          Main
        </motion.p>
        
        {mainNavItems.map((item) => (
          <SidebarItem 
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCollapsed={isCollapsed}
          />
        ))}

        {/* Management Section (Role-based) */}
        {allowedManagement.length > 0 && (
          <>
            <motion.p 
              animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : "auto", marginTop: isCollapsed ? 0 : 24, marginBottom: isCollapsed ? 0 : 8 }}
              className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Management
            </motion.p>
            {allowedManagement.map((item) => (
              <SidebarItem 
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isCollapsed={isCollapsed}
              />
            ))}
          </>
        )}

        {/* Support Section */}
        <div className="mt-6 pt-4 border-t border-border space-y-1">
          <motion.p 
            animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : "auto", marginBottom: isCollapsed ? 0 : 8 }}
            className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Support
          </motion.p>
          {bottomNavItems.map((item) => (
            <SidebarItem 
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={toggleCollapse}
          className="flex w-full items-center justify-center h-10 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </motion.aside>
  );
}

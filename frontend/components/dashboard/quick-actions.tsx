"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackagePlus, CalendarPlus, Wrench, FileText, UserPlus, Building } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function QuickActions() {
  const actions = [
    {
      title: "Register Asset",
      icon: PackagePlus,
      href: "/dashboard/assets/new",
      color: "bg-blue-500",
    },
    {
      title: "Book Resource",
      icon: CalendarPlus,
      href: "/dashboard/bookings/new",
      color: "bg-purple-500",
    },
    {
      title: "Raise Maintenance",
      icon: Wrench,
      href: "/dashboard/maintenance/new",
      color: "bg-amber-500",
    },
    {
      title: "Generate Report",
      icon: FileText,
      href: "/dashboard/reports/new",
      color: "bg-emerald-500",
    },
    {
      title: "Invite Employee",
      icon: UserPlus,
      href: "/dashboard/employees/new",
      color: "bg-pink-500",
    },
    {
      title: "Create Department",
      icon: Building,
      href: "/dashboard/departments/new",
      color: "bg-indigo-500",
    },
  ];

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
          {actions.map((action, idx) => (
            <Link key={idx} href={action.href} className="block">
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center justify-center p-4 text-center border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-colors h-full gap-3 cursor-pointer group"
              >
                <div className={`p-3 rounded-full text-white shadow-sm ${action.color} group-hover:shadow-md transition-shadow`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium leading-tight">
                  {action.title}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

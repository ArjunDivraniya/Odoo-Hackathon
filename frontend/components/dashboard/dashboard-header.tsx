"use client";

import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function DashboardHeader() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const firstName = user?.firstName || "User";
  const organizationName = "AssetFlow Inc."; // Can be pulled from context if available

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6"
    >
      <div className="space-y-1 sm:space-y-2">
        <Breadcrumb className="hidden sm:flex text-sm text-muted-foreground mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Organization</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{organizationName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Good morning, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Here is what's happening with your assets today.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        <div className="hidden md:flex items-center gap-2 bg-background border px-3 py-2 rounded-md shadow-sm text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{format(currentTime, "MMMM d, yyyy")}</span>
          <span className="text-muted-foreground ml-1">{format(currentTime, "HH:mm")}</span>
        </div>
        <Button asChild className="w-full sm:w-auto shadow-sm">
          <Link href="/dashboard/assets/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

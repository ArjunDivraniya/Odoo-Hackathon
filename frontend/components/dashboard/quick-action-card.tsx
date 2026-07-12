"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  colorClass?: string;
}

export function QuickActionCard({ title, description, icon, href, colorClass = "bg-primary/10 text-primary" }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex flex-col h-full rounded-xl border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg mb-4 ${colorClass}`}>
          {icon}
        </div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>
      </motion.div>
    </Link>
  );
}

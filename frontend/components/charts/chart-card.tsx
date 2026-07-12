"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyMessage = "No data available",
  errorMessage = "Failed to load chart data",
  children,
  className = "",
  contentClassName = "h-[300px]",
}: ChartCardProps) {
  return (
    <Card className={`border-border/50 shadow-sm flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={`flex-1 flex flex-col ${contentClassName}`}>
        {isLoading ? (
          <div className="w-full h-full flex flex-col justify-end gap-2">
            <div className="flex items-end justify-between h-full gap-2 px-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton 
                  key={i} 
                  className="w-full rounded-t-sm" 
                  style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
                />
              ))}
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </div>
        ) : isError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-4 text-center">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50 text-destructive" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        ) : isEmpty ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-4 text-center">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="w-full h-full min-h-0">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

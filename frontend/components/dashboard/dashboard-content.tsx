"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  TrendingUp,
  Clock,
} from "lucide-react";

export function DashboardContent() {
  const { user } = useAuth();

  const firstName = user?.firstName || "User";
  const roleName = user?.roles?.[0]?.role?.name || "Employee";
  const department = user?.employeeProfile?.department?.name || "Unassigned";

  const stats = [
    {
      title: "Total Assets",
      value: "--",
      icon: Package,
      change: "Manage your inventory",
    },
    {
      title: "Active Allocations",
      value: "--",
      icon: ArrowLeftRight,
      change: "Track assignments",
    },
    {
      title: "Pending Maintenance",
      value: "--",
      icon: Wrench,
      change: "Needs attention",
    },
    {
      title: "Completed Audits",
      value: "--",
      icon: ClipboardCheck,
      change: "This quarter",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-700 text-white border-0">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">
                Welcome back, {firstName}
              </h2>
              <p className="text-slate-300">
                {roleName} &middot; {department}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="h-4 w-4" />
              <span>
                Last login:{" "}
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "First login"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No recent activity
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your recent actions will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

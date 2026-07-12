"use client";

import { useDashboardSummary } from "@/hooks/use-dashboard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PendingTasks } from "@/components/dashboard/pending-tasks";
import { NotificationsPreview } from "@/components/dashboard/notifications-preview";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { AlertCircle, LineChart as ChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Next-ready dynamic imports could be used here for heavy recharts
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// Mock data for the chart since the user requested Recharts but didn't specify a chart endpoint
// Usually this comes from an endpoint like /dashboard/analytics
const chartData = [
  { name: 'Mon', assets: 400, allocations: 240 },
  { name: 'Tue', assets: 450, allocations: 139 },
  { name: 'Wed', assets: 420, allocations: 380 },
  { name: 'Thu', assets: 500, allocations: 390 },
  { name: 'Fri', assets: 550, allocations: 480 },
  { name: 'Sat', assets: 590, allocations: 380 },
  { name: 'Sun', assets: 650, allocations: 430 },
];

export function DashboardContent() {
  const { data: summary, isLoading, isError } = useDashboardSummary();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !summary) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh] border rounded-lg bg-card">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Unable to load dashboard data</h3>
        <p className="text-muted-foreground mt-1">Please ensure the backend servers are running.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader />
      
      <KpiCards summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Trends Chart */}
          <Card className="border-border/50 shadow-sm flex-1 min-h-[350px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartIcon className="h-5 w-5 text-primary" />
                Asset Movement Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAlloc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="assets" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAssets)" />
                    <Area type="monotone" dataKey="allocations" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorAlloc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[300px]">
            <QuickActions />
            <PendingTasks />
          </div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-6 flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-[400px]">
            <RecentActivity />
          </div>
          <div className="shrink-0">
            <NotificationsPreview />
          </div>
        </div>

      </div>
    </div>
  );
}

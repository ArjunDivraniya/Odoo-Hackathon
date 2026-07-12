"use client";

import { useCompany } from "@/hooks/use-company";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/organization/shared/status-badge";
import { CompanyEditDialog } from "./company-edit-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Phone, Mail, Clock, Building2 } from "lucide-react";

export function CompanyTab() {
  const { data: company, isLoading, isError, refetch } = useCompany();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !company) {
    return <ErrorState title="Failed to load company" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Company Profile</CardTitle>
            <CardDescription>Manage your organization's core information</CardDescription>
          </div>
          <CompanyEditDialog company={company} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
            <div className="relative group">
              <Avatar className="h-32 w-32 rounded-xl border bg-muted/50">
                <AvatarImage src={company.logoUrl} className="object-contain p-2" />
                <AvatarFallback className="text-3xl rounded-xl">
                  {company.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="text-xs text-white font-medium">Update Logo</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-bold tracking-tight">{company.name}</h3>
                <StatusBadge status={company.status} />
              </div>
              <p className="text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md text-sm inline-flex">
                CODE: {company.code}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Contact Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{company.email || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{company.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {company.website || "Not provided"}
                  </a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="max-w-[250px]">{company.address || "Not provided"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Regional Settings
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/30">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Timezone</p>
                    <p className="text-sm font-medium">{company.timezone || "UTC"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Currency</p>
                    <p className="text-sm font-medium">{company.currency || "USD"}</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Working Hours</p>
                  <p className="text-sm font-medium">{company.workingHours || "09:00 AM - 05:00 PM"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

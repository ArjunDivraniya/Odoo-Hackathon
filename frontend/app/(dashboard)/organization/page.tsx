"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, FolderTree, Network } from "lucide-react";
// We will build these components in the following steps
import { CompanyTab } from "@/components/organization/company/company-tab";
import { DepartmentsTab } from "@/components/organization/departments/departments-tab";
// import { CategoriesTab } from "@/components/organization/categories/categories-tab";
// import { EmployeesTab } from "@/components/organization/employees/employees-tab";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Organization Setup</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-background border h-12 w-full md:w-auto overflow-x-auto flex justify-start rounded-lg shadow-sm">
          <TabsTrigger value="company" className="h-9 px-4 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <Building2 className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="departments" className="h-9 px-4 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <Network className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="categories" className="h-9 px-4 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <FolderTree className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="employees" className="h-9 px-4 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <Users className="w-4 h-4 mr-2" />
            Employees
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-4 m-0">
          <CompanyTab />
        </TabsContent>
        
        <TabsContent value="departments" className="space-y-4 m-0">
          <DepartmentsTab />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4 m-0">
          <div className="h-64 border border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-card/50">Categories Tab Placeholder</div>
          {/* <CategoriesTab /> */}
        </TabsContent>
        
        <TabsContent value="employees" className="space-y-4 m-0">
          <div className="h-64 border border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-card/50">Employees Tab Placeholder</div>
          {/* <EmployeesTab /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

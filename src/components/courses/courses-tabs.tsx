"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface CoursesTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  totalCount: number
  draftCount: number
  publishedCount: number
  archivedCount: number
  children: React.ReactNode
}

interface TabConfig {
  id: string
  label: string
  count: number
}

export function CoursesTabs({
  activeTab,
  onTabChange,
  totalCount,
  draftCount,
  publishedCount,
  archivedCount,
  children,
}: CoursesTabsProps) {
  const tabs: TabConfig[] = [
    {
      id: "all",
      label: "Todos",
      count: totalCount,
    },
    {
      id: "draft",
      label: "Borradores",
      count: draftCount,
    },
    {
      id: "published",
      label: "Publicados",
      count: publishedCount,
    },
    {
      id: "archived",
      label: "Archivados",
      count: archivedCount,
    },
  ]

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="h-auto p-1 bg-muted/50">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <span className="text-sm font-medium">{tab.label}</span>
            <Badge
              variant={activeTab === tab.id ? "default" : "secondary"}
              className="ml-2 h-5 px-1.5 text-xs"
            >
              {tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={activeTab} className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  )
}

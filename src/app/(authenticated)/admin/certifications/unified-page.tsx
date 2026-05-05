"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Shield, Wand2 } from "lucide-react"
import { ClientCertificates } from "./tabs/certificates-tab"
import { ClientCertifications } from "./tabs/certifications-tab"
import { DemoCertificatesTab } from "./tabs/demo-certificates-tab"

export function UnifiedCertificatesPage() {
  const [activeTab, setActiveTab] =
    useState<"documents" | "lifecycle" | "demo">("documents")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Gestión de Certificaciones</h1>
        <p className="text-muted-foreground mt-2">
          Administra certificados PDF y el ciclo de vida de certificaciones
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "documents" | "lifecycle" | "demo")
        }
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentos PDF
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="gap-2">
            <Shield className="h-4 w-4" />
            Ciclo de Vida
          </TabsTrigger>
          <TabsTrigger value="demo" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Demo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <ClientCertificates />
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-6">
          <ClientCertifications />
        </TabsContent>

        <TabsContent value="demo" className="mt-6">
          <DemoCertificatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

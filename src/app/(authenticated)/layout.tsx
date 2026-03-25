import { auth } from "@/auth"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { AppFooter } from "@/components/layout/app-footer"
import { redirect } from "next/navigation"

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <AppFooter />
      </div>
    </SidebarProvider>
  )
}

"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, LogOut, User } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const ROLE_LABELS: Record<string, { label: string; variant: "secondary" | "destructive" | "outline" }> = {
  COLLABORATOR: { label: "Colaborador", variant: "secondary" },
  ADMIN: { label: "Admin", variant: "outline" },
  SUPERADMIN: { label: "SuperAdmin", variant: "destructive" },
}

export function NavUser({
  userProp,
}: {
  userProp?: { name?: string; email?: string; avatar?: string }
}) {
  const { data: session } = useSession()
  const { isMobile } = useSidebar()
  const router = useRouter()

  const userRaw = session?.user ?? userProp ?? { name: "Invitado", email: "", avatar: "" }
  const user = userRaw as { name?: string; email?: string; image?: string; avatar?: string; role?: string }

  const initials =
    (user.name || "")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("") || "U"

  const roleInfo = user.role ? ROLE_LABELS[user.role] : undefined

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.image || user.avatar ? (
                  <AvatarImage
                    src={(user.image ?? user.avatar) as string}
                    alt={user.name ?? ""}
                  />
                ) : (
                  <AvatarFallback className="rounded-lg text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <Avatar className="h-9 w-9 rounded-lg">
                  {user.image || user.avatar ? (
                    <AvatarImage
                      src={(user.image ?? user.avatar) as string}
                      alt={user.name ?? ""}
                    />
                  ) : (
                    <AvatarFallback className="rounded-lg text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-1 flex-col text-left text-sm">
                  <span className="font-medium leading-tight">{user.name}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{user.email}</span>
                  {roleInfo && (
                    <Badge variant={roleInfo.variant} className="mt-1 w-fit text-[10px] px-1.5 py-0">
                      {roleInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

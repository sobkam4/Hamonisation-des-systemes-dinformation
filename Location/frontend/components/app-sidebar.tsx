"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useApiData } from "@/lib/api-context"
import { getInitiales } from "@/lib/format"
import { apiClient } from "@/lib/api"

const navPrincipal = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
]

const navGestion = [
  { title: "Biens", url: "/biens", icon: Building2 },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Contrats", url: "/contrats", icon: FileText },
]

const navFinances = [
  { title: "Paiements", url: "/paiements", icon: CreditCard },
  { title: "Depenses", url: "/depenses", icon: Receipt },
  { title: "Analyse", url: "/analyse", icon: BarChart3 },
  { title: "Rapport", url: "/rapport", icon: FileText },
]

const navSysteme = [
  { title: "Parametres", url: "/parametres", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { utilisateurActuel } = useApiData()
  
  // Fallback si utilisateur non chargé
  const user = utilisateurActuel || {
    id: "0",
    nom: "Utilisateur",
    prenom: "",
    email: "",
    role: "Gestionnaire" as const,
  }

  const handleLogout = () => {
    apiClient.removeToken()
    router.push("/login")
  }

  const renderGroup = (label: string, items: typeof navPrincipal) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + "/")}>
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">ImmoGestion</span>
            <span className="text-xs text-muted-foreground">Gestion locative</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Principal", navPrincipal)}
        {renderGroup("Gestion", navGestion)}
        {renderGroup("Finances", navFinances)}
        {renderGroup("Systeme", navSysteme)}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-auto" asChild>
              <Link href="/parametres">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs">
                    {getInitiales(user.nom, user.prenom)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium">
                    {user.prenom} {user.nom}
                  </span>
                  <span className="text-xs text-muted-foreground">{user.role}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Deconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

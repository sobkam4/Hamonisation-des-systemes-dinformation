"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitiales } from "@/lib/format"
import { Settings, User, Bell, Shield, Database } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function ParametresPage() {
  const { utilisateurActuel } = useApiData()
  
  if (!utilisateurActuel) {
    return <div>Chargement...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Parametres" description="Gerez vos parametres et preferences" />

      {/* Profil utilisateur */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/15 text-primary text-lg">
                {getInitiales(utilisateurActuel.nom, utilisateurActuel.prenom)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{utilisateurActuel.prenom} {utilisateurActuel.nom}</CardTitle>
              <CardDescription>{utilisateurActuel.email}</CardDescription>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                  {utilisateurActuel.role}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <User className="size-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Profil utilisateur</div>
                <div className="text-muted-foreground">Modifiez vos informations personnelles</div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3 text-sm">
              <Bell className="size-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-muted-foreground">Configurez vos preferences de notification</div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3 text-sm">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Securite</div>
                <div className="text-muted-foreground">Gerez votre mot de passe et la securite du compte</div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3 text-sm">
              <Database className="size-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Donnees</div>
                <div className="text-muted-foreground">Exportez ou importez vos donnees</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parametres de l'application */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-5" />
            <CardTitle>Parametres de l'application</CardTitle>
          </div>
          <CardDescription>Configuration generale du systeme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Langue</div>
              <div className="text-sm text-muted-foreground">Francais</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-1">Devise</div>
              <div className="text-sm text-muted-foreground">GNF (Guinée Francs)</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-1">Fuseau horaire</div>
              <div className="text-sm text-muted-foreground">Africa/Dakar (UTC+0)</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-1">Format de date</div>
              <div className="text-sm text-muted-foreground">DD/MM/YYYY</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations systeme */}
      <Card>
        <CardHeader>
          <CardTitle>Informations systeme</CardTitle>
          <CardDescription>Version et details techniques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environnement</span>
              <span className="font-medium">Production</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Backend</span>
              <span className="font-medium">http://localhost:8000/api</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

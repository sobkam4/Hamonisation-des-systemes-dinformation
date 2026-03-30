'use client'

import { User, Palette, LogOut } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import { ModeToggle } from '@/components/mode-toggle'

export default function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Parametres"
        description="Compte connecte et preferences d'affichage"
      />

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profil</CardTitle>
          </div>
          <CardDescription>Informations de votre compte KamGestion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Nom d&apos;utilisateur</span>
            <span className="font-medium text-foreground">{user?.username ?? '—'}</span>
          </div>
          <Separator />
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-foreground">{user?.email || '—'}</span>
          </div>
          {(user?.first_name || user?.last_name) && (
            <>
              <Separator />
              <div className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Nom affiche</span>
                <span className="font-medium text-foreground">
                  {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                </span>
              </div>
            </>
          )}
          <Separator />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Role</span>
            {user?.is_staff ? (
              <Badge variant="secondary">Administrateur</Badge>
            ) : (
              <Badge variant="outline">Utilisateur</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Apparence</CardTitle>
          </div>
          <CardDescription>Theme clair, sombre ou selon le systeme</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Choisissez le mode d'affichage de l'application.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Session</CardTitle>
          </div>
          <CardDescription>Terminer votre session sur cet appareil</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Se deconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

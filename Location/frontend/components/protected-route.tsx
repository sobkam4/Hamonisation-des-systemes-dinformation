"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient, API_ENDPOINTS } from "@/lib/api"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        router.push("/login")
        return
      }

      try {
        // Vérifier que le token est valide en appelant le profil
        await apiClient.get(API_ENDPOINTS.AUTH.PROFILE)
        setIsAuthenticated(true)
      } catch (error: any) {
        // Ne pas rediriger si c'est une erreur silencieuse (redirection déjà en cours)
        if (error.silent || error.isRedirecting) {
          return
        }
        
        // Token invalide ou expiré, ou erreur réseau
        apiClient.removeToken()
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    // Afficher un loader pendant la vérification
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

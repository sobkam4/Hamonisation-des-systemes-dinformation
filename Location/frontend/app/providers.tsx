"use client"

import { ApiProvider } from '@/lib/api-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApiProvider>
      {children}
    </ApiProvider>
  )
}

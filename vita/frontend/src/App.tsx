import { useEffect, useState } from 'react'
import './App.css'
import { BottomNav } from './components/BottomNav'
import type { GuideContent, HomeContent, MapContent, ProfileContent, TabId, TrainingContent } from './lib/types'
import { GuideScreen } from './screens/GuideScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MapScreen } from './screens/MapScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { TrainingScreen } from './screens/TrainingScreen'
import { vitaApi } from './services/vitaApi'

type AppData = {
  home: HomeContent
  guide: GuideContent
  map: MapContent
  training: TrainingContent
  profile: ProfileContent
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [data, setData] = useState<AppData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadApp() {
      try {
        setIsLoading(true)
        const [home, guide, map, training, profile] = await Promise.all([
          vitaApi.getHomeContent(),
          vitaApi.getGuideContent(),
          vitaApi.getMapContent(),
          vitaApi.getTrainingContent(),
          vitaApi.getProfileContent(),
        ])

        if (!isMounted) return
        setData({ home, guide, map, training, profile })
        setError(null)
      } catch {
        if (!isMounted) return
        setError('Impossible de charger les contenus VITA.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadApp()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <div className="screen-content">{renderContent(activeTab, setActiveTab, data, isLoading, error)}</div>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  )
}

function renderContent(
  activeTab: TabId,
  setActiveTab: (tab: TabId) => void,
  data: AppData | null,
  isLoading: boolean,
  error: string | null,
) {
  if (isLoading) {
    return <section className="screen loading-state">Chargement de l'interface VITA...</section>
  }

  if (error || !data) {
    return <section className="screen empty-state">{error ?? 'Aucune donnée disponible.'}</section>
  }

  switch (activeTab) {
    case 'guide':
      return <GuideScreen content={data.guide} />
    case 'map':
      return <MapScreen content={data.map} />
    case 'training':
      return <TrainingScreen content={data.training} />
    case 'profile':
      return <ProfileScreen content={data.profile} />
    case 'home':
    default:
      return <HomeScreen content={data.home} onNavigate={setActiveTab} />
  }
}

export default App

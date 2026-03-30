import type { ReactNode } from 'react'
import type { TabId } from '../lib/types'
import { AppIcon, BookOpen, Heart, MapPin, User } from './icons'

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'home', label: 'Accueil', icon: <Heart className="nav-icon" /> },
  { id: 'guide', label: 'Guide', icon: <BookOpen className="nav-icon" /> },
  { id: 'map', label: 'Carte', icon: <MapPin className="nav-icon" /> },
  { id: 'training', label: 'Formation', icon: <AppIcon name="award" className="nav-icon" /> },
  { id: 'profile', label: 'Profil', icon: <User className="nav-icon" /> },
]

export function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: TabId
  onChange: (tab: TabId) => void
}) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-button ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

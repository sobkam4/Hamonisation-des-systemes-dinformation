import type { HomeContent, TabId } from '../lib/types'
import { AppIcon, BookOpen } from '../components/icons'

export function HomeScreen({
  content,
  onNavigate,
}: {
  content: HomeContent
  onNavigate: (tab: TabId) => void
}) {
  return (
    <section className="screen screen-home">
      <div className="brand-lockup">
        <AppIcon name="heart" className="brand-heart" />
        <div>
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
        </div>
      </div>

      <button className="hero-banner urgent-banner" type="button">
        <AppIcon name="siren" className="hero-banner-icon" />
        <div>
          <strong>SOS URGENCE</strong>
          <span>Appel d'urgence immédiat</span>
        </div>
      </button>

      <button className="hero-banner guide-banner" type="button" onClick={() => onNavigate('guide')}>
        <BookOpen className="hero-banner-icon icon-success" />
        <div>
          <strong>GUIDE DE SECOURS</strong>
          <span>Protocoles pas à pas</span>
        </div>
      </button>

      <div className="section-title">
        <h2>Accès rapide</h2>
      </div>

      <div className="shortcut-grid">
        {content.shortcuts.map((shortcut) => (
          <button
            key={shortcut.title}
            type="button"
            className="shortcut-card"
            onClick={() => onNavigate(shortcut.target)}
          >
            <AppIcon name={shortcut.icon} className={`shortcut-icon icon-${shortcut.accent}`} />
            <strong>{shortcut.title}</strong>
            <span>{shortcut.subtitle}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

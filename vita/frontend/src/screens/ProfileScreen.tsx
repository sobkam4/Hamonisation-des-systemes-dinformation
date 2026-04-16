import { Lock, Pencil, QrCode } from '../components/icons'
import { AppIcon } from '../components/icons'
import { InfoTile, SectionBlock, StatusTag, ScreenHeader } from '../components/ui'
import type { ProfileContent } from '../lib/types'

export function ProfileScreen({ content }: { content: ProfileContent }) {
  return (
    <section className="screen screen-profile">
      <ScreenHeader title={content.title} subtitle={content.subtitle} />

      <article className="identity-card">
        <div className="identity-top">
          <div className="avatar-ring">
            <AppIcon name="user" className="avatar-icon" />
          </div>
          <div className="identity-copy">
            <h3>{content.name}</h3>
            <p>{content.meta}</p>
          </div>
          <button className="icon-ghost" type="button" aria-label="Modifier le profil">
            <Pencil />
          </button>
        </div>

        <div className="identity-actions">
          <button className="primary-chip" type="button">
            <QrCode />
            QR d'urgence
          </button>
          <div className="secure-pill">
            <Lock />
            AES-256
          </div>
        </div>
      </article>

      <div className="split-grid">
        {content.metrics.map((metric) => (
          <InfoTile
            key={metric.subtitle}
            title={metric.title}
            subtitle={metric.subtitle}
            icon={metric.icon}
            tone={metric.accent}
          />
        ))}
      </div>

      {content.sections.map((section) => (
        <SectionBlock key={section.title} title={section.title} icon={section.icon} tone={section.accent}>
          {section.title === 'Allergies' ? (
            <div className="pill-group">
              {section.items.map((item) => (
                <StatusTag key={item} tone="danger">
                  {item}
                </StatusTag>
              ))}
            </div>
          ) : (
            <ul className="bullet-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </SectionBlock>
      ))}
    </section>
  )
}

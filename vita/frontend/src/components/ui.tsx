import type { ReactNode } from 'react'
import type { AccentTone, IconName } from '../lib/types'
import { AppIcon, Search } from './icons'

export function ScreenHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="screen-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}

export function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="search-box">
      <Search className="search-icon" />
      <input type="text" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export function ChipRow<T extends string>({
  items,
  selected,
  onSelect,
}: {
  items: T[]
  selected: T
  onSelect: (value: T) => void
}) {
  return (
    <div className="chip-row" role="tablist" aria-label="Filtres">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`chip ${item === selected ? 'is-selected' : ''}`}
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function StatusTag({ children, tone }: { children: ReactNode; tone: AccentTone }) {
  return <span className={`status-tag tone-${tone}`}>{children}</span>
}

export function StatCard({
  icon,
  accent,
  value,
  label,
}: {
  icon: IconName
  accent: AccentTone
  value: string
  label: string
}) {
  return (
    <article className="stat-card">
      <AppIcon name={icon} className={`feature-icon icon-${accent}`} />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

export function InfoTile({
  title,
  subtitle,
  icon,
  tone,
}: {
  title: string
  subtitle: string
  icon: IconName
  tone: AccentTone
}) {
  return (
    <article className={`info-tile tone-${tone}`}>
      <AppIcon name={icon} className={`feature-icon icon-${tone}`} />
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </article>
  )
}

export function SectionBlock({
  title,
  icon,
  tone,
  children,
}: {
  title: string
  icon: IconName
  tone: AccentTone
  children: ReactNode
}) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <AppIcon name={icon} className={`section-icon icon-${tone}`} />
        <h2>{title}</h2>
      </div>
      <div className="section-card">{children}</div>
    </section>
  )
}

export function IconBadge({
  icon,
  accent,
  className = '',
}: {
  icon: IconName
  accent: AccentTone
  className?: string
}) {
  return (
    <div className={`icon-badge bg-${accent} ${className}`.trim()}>
      <AppIcon name={icon} className={`feature-icon icon-${accent}`} />
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>
}

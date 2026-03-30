import { useMemo, useState } from 'react'
import { Navigation } from '../components/icons'
import { ChipRow, EmptyState, IconBadge, ScreenHeader, SearchInput, StatCard, StatusTag } from '../components/ui'
import type { AccentTone, IconName, MapContent, MapFilter } from '../lib/types'

export function MapScreen({ content }: { content: MapContent }) {
  const [selectedFilter, setSelectedFilter] = useState<MapFilter>('Tous')
  const [query, setQuery] = useState('')

  const visibleResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return content.resources.filter((resource) => {
      const matchesFilter = selectedFilter === 'Tous' || resource.category === selectedFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        resource.title.toLowerCase().includes(normalizedQuery) ||
        resource.subtitle.toLowerCase().includes(normalizedQuery)

      return matchesFilter && matchesQuery
    })
  }, [content.resources, query, selectedFilter])

  const stats = useMemo<Array<{ icon: IconName; accent: AccentTone; value: string; label: string }>>(
    () => [
      { icon: 'zap', accent: 'danger', value: String(content.resources.filter((item) => item.category === 'DAE').length), label: 'DAE' },
      {
        icon: 'building',
        accent: 'info',
        value: String(content.resources.filter((item) => item.category === 'Hôpitaux').length),
        label: 'Hôpitaux',
      },
      {
        icon: 'pill',
        accent: 'success',
        value: String(content.resources.filter((item) => item.category === 'Pharmacies').length),
        label: 'Pharmacies',
      },
    ],
    [content.resources],
  )

  return (
    <section className="screen screen-map">
      <ScreenHeader title={content.title} subtitle={content.subtitle} />
      <SearchInput placeholder="Rechercher..." value={query} onChange={setQuery} />
      <ChipRow items={content.filters} selected={selectedFilter} onSelect={setSelectedFilter} />

      <article className="map-card">
        <div className="map-grid" />
        <div className="map-center">
          <div className="map-pin">
            <Navigation />
          </div>
          <h3>Vue carte interactive</h3>
          <p>Localisation en temps réel</p>
        </div>
      </article>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            accent={stat.accent}
            value={stat.value}
            label={stat.label}
          />
        ))}
      </div>

      <div className="results-header">
        <h3>{visibleResources.length} résultats</h3>
      </div>

      <div className="card-list">
        {visibleResources.length === 0 ? <EmptyState message="Aucun point de secours trouvé pour cette recherche." /> : null}
        {visibleResources.map((resource) => (
          <article key={`${resource.title}-${resource.distance}`} className="resource-card">
            <IconBadge icon={resource.icon} accent={resource.accent} />
            <div className="list-card-content">
              <h3>{resource.title}</h3>
              <p>{resource.subtitle}</p>
              <div className="meta-row">
                <span className="distance">
                  <Navigation className="inline-icon" />
                  {resource.distance}
                </span>
                <StatusTag tone="success">{resource.status}</StatusTag>
              </div>
            </div>
            <button className="action-circle" type="button" aria-label={`Itinéraire vers ${resource.title}`}>
              <Navigation />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

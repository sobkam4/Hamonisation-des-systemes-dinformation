import { useMemo, useState } from 'react'
import { EmptyState, ChipRow, IconBadge, ScreenHeader, SearchInput, StatusTag } from '../components/ui'
import type { GuideContent, GuideFilter } from '../lib/types'

export function GuideScreen({ content }: { content: GuideContent }) {
  const [selectedFilter, setSelectedFilter] = useState<GuideFilter>('Tous')
  const [query, setQuery] = useState('')

  const visibleProtocols = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return content.protocols.filter((protocol) => {
      const matchesFilter = selectedFilter === 'Tous' || protocol.category === selectedFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        protocol.title.toLowerCase().includes(normalizedQuery) ||
        protocol.category.toLowerCase().includes(normalizedQuery)

      return matchesFilter && matchesQuery
    })
  }, [content.protocols, query, selectedFilter])

  return (
    <section className="screen screen-guide">
      <ScreenHeader title={content.title} subtitle={content.subtitle} />
      <SearchInput placeholder="Rechercher un protocole..." value={query} onChange={setQuery} />
      <ChipRow items={content.filters} selected={selectedFilter} onSelect={setSelectedFilter} />

      <div className="card-list">
        {visibleProtocols.length === 0 ? <EmptyState message="Aucun protocole ne correspond à votre recherche." /> : null}
        {visibleProtocols.map((protocol) => (
          <article key={protocol.title} className="list-card">
            <IconBadge icon={protocol.icon} accent={protocol.accent} />
            <div className="list-card-content">
              <h3>{protocol.title}</h3>
              <p>{protocol.category}</p>
              <div className="meta-row">
                <span>{protocol.duration}</span>
                <StatusTag tone={protocol.accent}>{protocol.level}</StatusTag>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

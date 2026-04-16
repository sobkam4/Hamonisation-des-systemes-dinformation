import { useMemo, useState } from 'react'
import { Award, PlayCircle, Trophy } from '../components/icons'
import { ChipRow, EmptyState, IconBadge, ScreenHeader, StatusTag } from '../components/ui'
import type { TrainingContent, TrainingFilter } from '../lib/types'

export function TrainingScreen({ content }: { content: TrainingContent }) {
  const [selectedFilter, setSelectedFilter] = useState<TrainingFilter>('Tous')

  const visibleCourses = useMemo(
    () => content.courses.filter((course) => selectedFilter === 'Tous' || course.category === selectedFilter),
    [content.courses, selectedFilter],
  )

  const progress = Math.round((content.summary.completed / content.summary.total) * 100)

  return (
    <section className="screen screen-training">
      <ScreenHeader title={content.title} subtitle={content.subtitle} />

      <article className="training-hero">
        <div>
          <strong>
            {content.summary.completed}/{content.summary.total}
          </strong>
          <p>Cours complétés</p>
        </div>
        <Trophy className="hero-trophy" />
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="hero-badges">
          <span className="medal bronze">
            <Award />
          </span>
          <span className="medal silver">
            <Award />
          </span>
        </div>
      </article>

      <ChipRow items={content.filters} selected={selectedFilter} onSelect={setSelectedFilter} />

      <div className="card-list">
        {visibleCourses.length === 0 ? <EmptyState message="Aucun cours disponible pour ce niveau." /> : null}
        {visibleCourses.map((course) => (
          <article key={course.title} className="resource-card training-card">
            <IconBadge icon={course.icon} accent={course.accent} />
            <div className="list-card-content">
              <h3>{course.title}</h3>
              <p>{course.category}</p>
              <div className="meta-row">
                <span>{course.duration}</span>
                <StatusTag tone={course.accent}>{course.badge}</StatusTag>
                <span className="reward">{course.reward}</span>
              </div>
            </div>
            {course.action === 'play' ? (
              <button className="action-circle" type="button" aria-label={`Lancer ${course.title}`}>
                <PlayCircle />
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

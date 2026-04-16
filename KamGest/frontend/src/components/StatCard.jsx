function StatCard({ label, value, hint }) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      <p className="muted">{hint}</p>
    </article>
  )
}

export default StatCard

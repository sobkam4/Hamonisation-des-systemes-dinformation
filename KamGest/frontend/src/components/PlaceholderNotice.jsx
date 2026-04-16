function PlaceholderNotice({ title, description, items = [] }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {description ? <p className="muted">{description}</p> : null}
      {items.length ? (
        <ul className="feature-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default PlaceholderNotice

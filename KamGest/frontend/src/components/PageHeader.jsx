import { useLanguage } from '../context/useLanguage.js'

function PageHeader({ title, description, actions }) {
  const { t } = useLanguage()

  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{t('common.interface')}</p>
        <h2>{title}</h2>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

export default PageHeader

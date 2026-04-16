import { useEffect, useMemo, useRef, useState } from 'react'

import PageHeader from '../components/PageHeader.jsx'
import { useLanguage } from '../context/useLanguage.js'
import {
  createUser,
  deleteUser,
  downloadUserTemplateCsv,
  downloadUserTemplateExcel,
  exportUsersExcel,
  importUsersSpreadsheet,
  listUsers,
  updateUser,
} from '../services/userService.js'

const initialForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  is_active: 'true',
  is_staff: 'false',
}

function UserManagementPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingUserId, setEditingUserId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const data = await listUsers()
      setUsers(data)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function startEditing(user) {
    setEditingUserId(user.id)
    setSuccessMessage('')
    setFormData({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      is_active: String(user.is_active),
      is_staff: String(user.is_staff),
    })
  }

  function resetForm() {
    setEditingUserId(null)
    setFormData(initialForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    const payload = {
      username: formData.username,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      is_active: formData.is_active === 'true',
      is_staff: formData.is_staff === 'true',
    }

    if (formData.password) {
      payload.password = formData.password
    }

    try {
      if (editingUserId) {
        await updateUser(editingUserId, payload)
        setSuccessMessage(t('users.updatedSuccess'))
      } else {
        await createUser(payload)
        setSuccessMessage(t('users.createdSuccess'))
      }

      resetForm()
      await loadUsers()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function toggleFlag(user, fieldName) {
    setError('')
    setSuccessMessage('')

    try {
      const nextValue = !user[fieldName]
      await updateUser(user.id, { [fieldName]: nextValue })
      setSuccessMessage(t('users.updatedSuccess'))
      await loadUsers()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function handleDeleteUser(user) {
    const confirmed = window.confirm(t('users.confirmDelete', { username: user.username }))

    if (!confirmed) {
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      await deleteUser(user.id)
      await loadUsers()
      if (editingUserId === user.id) {
        resetForm()
      }
      setSuccessMessage(t('users.deletedSuccess', { username: user.username }))
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    setError('')
    setSuccessMessage('')

    try {
      await exportUsersExcel()
    } catch (exportError) {
      setError(exportError.message)
    } finally {
      setIsExporting(false)
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsImporting(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await importUsersSpreadsheet(file)
      await loadUsers()
      const errorsText = result.errors.length
        ? t('users.importedErrorsSuffix', { count: result.errors.length })
        : ''
      setSuccessMessage(
        t('users.importSuccess', { created: result.created, updated: result.updated, errors: errorsText }),
      )
    } catch (importError) {
      setError(importError.message)
    } finally {
      event.target.value = ''
      setIsImporting(false)
    }
  }

  async function handleTemplateDownload(kind) {
    setDownloadingTemplate(kind)
    setError('')
    setSuccessMessage('')

    try {
      if (kind === 'excel') {
        await downloadUserTemplateExcel()
      } else {
        await downloadUserTemplateCsv()
      }
    } catch (templateError) {
      setError(templateError.message)
    } finally {
      setDownloadingTemplate('')
    }
  }

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.is_active).length
    const staffUsers = users.filter((user) => user.is_staff).length
    const inactiveUsers = users.length - activeUsers

    return [
      {
        label: t('users.totalUsers'),
        value: users.length,
        hint: t('users.totalUsersHint'),
        accent: 'dashboard-kpi-accent-primary',
      },
      {
        label: t('users.active'),
        value: activeUsers,
        hint: t('users.activeHint'),
        accent: 'dashboard-kpi-accent-blue',
      },
      {
        label: t('common.staff'),
        value: staffUsers,
        hint: t('users.staffHint'),
        accent: 'dashboard-kpi-accent-green',
      },
      {
        label: t('users.inactive'),
        value: inactiveUsers,
        hint: t('users.inactiveHint'),
        accent: 'dashboard-kpi-accent-gold',
      },
    ]
  }, [t, users])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return users
    }

    return users.filter((user) =>
      [
        user.username,
        user.email,
        user.first_name,
        user.last_name,
        user.is_staff ? t('common.staff').toLowerCase() : t('common.user').toLowerCase(),
        user.is_active ? t('common.active').toLowerCase() : t('common.inactive').toLowerCase(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [searchTerm, t, users])

  return (
    <div className="content-stack user-page-shell">
      <PageHeader
        title={t('users.title')}
        description=""
        actions={
          <div className="page-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden-input"
              onChange={handleImportChange}
            />
            <button className="button button-secondary" type="button" onClick={handleImportClick} disabled={isImporting}>
              {isImporting ? t('common.importShort') : t('common.import')}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => handleTemplateDownload('excel')}
              disabled={Boolean(downloadingTemplate)}
            >
              {downloadingTemplate === 'excel' ? t('common.templateShort') : t('common.templateExcel')}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => handleTemplateDownload('csv')}
              disabled={Boolean(downloadingTemplate)}
            >
              {downloadingTemplate === 'csv' ? t('common.templateShort') : t('common.templateCsv')}
            </button>
            <button className="button button-secondary" type="button" onClick={handleExport} disabled={isExporting}>
              {isExporting ? t('common.exportShort') : t('common.export')}
            </button>
          </div>
        }
      />

      <section className="panel user-toolbar-panel">
        <div className="user-toolbar-copy">
          <p className="eyebrow">{t('users.administration')}</p>
          <h3>{editingUserId ? t('users.quickEdit') : t('users.modernInterface')}</h3>
        </div>
        <label className="dashboard-search user-search-field" htmlFor="user-search">
          <span className="dashboard-search-icon">⌕</span>
          <input
            id="user-search"
            type="search"
            placeholder={t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </section>

      <section className="dashboard-kpi-grid user-kpi-grid">
        {stats.map((stat) => (
          <article key={stat.label} className={`dashboard-kpi-card ${stat.accent}`}>
            <div className="dashboard-kpi-icon">{String(stat.value).slice(0, 1)}</div>
            <div>
              <strong className="dashboard-kpi-value">{stat.value}</strong>
              <p className="dashboard-kpi-label">{stat.label}</p>
              <p className="muted user-kpi-hint">{stat.hint}</p>
            </div>
          </article>
        ))}
      </section>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}
      <section className="panel user-info-strip">
        <div>
          <strong>{t('users.importSimple')}</strong>
        </div>
        <div>
          <strong>{t('users.editMode')}</strong>
        </div>
      </section>

      <div className="user-management-grid">
        <section className="panel user-form-panel">
          <div className="user-card-header">
            <div>
              <p className="eyebrow">{editingUserId ? t('users.edition') : t('users.creation')}</p>
              <h3>{editingUserId ? t('users.editUser') : t('users.createUser')}</h3>
            </div>
            {editingUserId ? (
              <span className="status-pill status-used">{t('users.inProgress')}</span>
            ) : (
              <span className="status-pill status-unused">{t('users.newLabel')}</span>
            )}
          </div>

          <form className="form-grid form-grid-single user-form-grid" onSubmit={handleSubmit}>
            <label>
              <span>{t('users.username')}</span>
              <input name="username" value={formData.username} onChange={handleChange} required />
            </label>

            <label>
              <span>{t('users.email')}</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <div className="user-form-two-columns">
              <label>
                <span>{t('users.firstName')}</span>
                <input name="first_name" value={formData.first_name} onChange={handleChange} />
              </label>

              <label>
                <span>{t('users.lastName')}</span>
                <input name="last_name" value={formData.last_name} onChange={handleChange} />
              </label>
            </div>

            <label>
              <span>{t('users.password')} {editingUserId ? t('users.keepPassword') : ''}</span>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!editingUserId}
              />
            </label>

            <div className="user-form-two-columns">
              <label>
                <span>{t('users.accountActive')}</span>
                <select name="is_active" value={formData.is_active} onChange={handleChange}>
                  <option value="true">{t('common.yes')}</option>
                  <option value="false">{t('common.no')}</option>
                </select>
              </label>

              <label>
                <span>{t('users.staffRights')}</span>
                <select name="is_staff" value={formData.is_staff} onChange={handleChange}>
                  <option value="true">{t('common.yes')}</option>
                  <option value="false">{t('common.no')}</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('users.saving')
                  : editingUserId
                    ? t('common.update')
                    : t('users.createAccount')}
              </button>
              {editingUserId ? (
                <button className="button button-secondary" type="button" onClick={resetForm}>
                  {t('common.cancel')}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="panel user-list-panel">
          <div className="user-card-header">
            <div>
              <p className="eyebrow">Repertoire</p>
              <h3>{t('users.existingAccounts')}</h3>
            </div>
            <span className="muted">{t('users.results', { count: filteredUsers.length })}</span>
          </div>

          {loading ? (
            <div className="panel-inline-message">{t('common.loading')}</div>
          ) : filteredUsers.length ? (
            <div className="user-directory-list">
              {filteredUsers.map((user) => (
                <article key={user.id} className="user-directory-row">
                  <div className="user-directory-content">
                    <div className="user-directory-profile">
                      <div className="user-directory-avatar">
                        {(user.username || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="user-directory-text">
                        <strong>{user.username}</strong>
                        <p className="muted user-directory-email">{user.email || t('common.noEmail')}</p>
                      </div>
                    </div>

                    <div className="user-directory-meta">
                      <div className="user-directory-badges">
                        <span className={user.is_active ? 'status-pill status-used' : 'status-pill status-expired'}>
                          {user.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                        <span className={user.is_staff ? 'status-pill status-unused' : 'status-pill status-expired'}>
                          {user.is_staff ? t('common.staff') : t('common.user')}
                        </span>
                      </div>
                      <span className="muted user-directory-name">
                        {`${user.first_name || ''} ${user.last_name || ''}`.trim() || t('users.noName')}
                      </span>
                    </div>
                  </div>

                  <div className="table-actions user-directory-actions">
                    <button
                      className="button button-secondary button-small button-compact"
                      type="button"
                      onClick={() => startEditing(user)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="button button-secondary button-small button-compact"
                      type="button"
                      onClick={() => toggleFlag(user, 'is_active')}
                    >
                      {user.is_active ? t('users.deactivate') : t('users.activate')}
                    </button>
                    <button
                      className="button button-secondary button-small button-compact"
                      type="button"
                      onClick={() => toggleFlag(user, 'is_staff')}
                    >
                      {user.is_staff ? t('users.removeStaff') : t('users.grantStaff')}
                    </button>
                    <button
                      className="button button-secondary button-small button-compact"
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel-inline-message">{t('common.noUsersFound')}</div>
          )}
        </section>
      </div>
    </div>
  )
}

export default UserManagementPage

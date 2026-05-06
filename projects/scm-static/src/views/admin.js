import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import './admin.css'

const Admin = (props) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, downloaded: 0, unique: 0 })

  // Extract key from URL or localStorage
  const urlParams = new URLSearchParams(window.location.search)
  const initialKey = urlParams.get('key') || localStorage.getItem('scm_admin_key') || ''
  const [key, setKey] = useState(initialKey)

  const fetchData = async () => {
    if (!key) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/downloads?key=${key}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to fetch data')
      }

      setData(result.data || [])
      calculateStats(result.data || [])
      localStorage.setItem('scm_admin_key', key)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (rows) => {
    const total = rows.length
    const downloaded = rows.filter(r => r.is_downloaded).length
    const unique = new Set(rows.map(r => r.email)).size
    setStats({ total, downloaded, unique })
  }

  useEffect(() => {
    fetchData()
  }, [key])

  const handleExportCSV = () => {
    window.open(`/api/admin/downloads/csv?key=${key}`, '_blank')
  }

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.email.toLowerCase().includes(search.toLowerCase()) ||
    item.ip_address.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString()
  }

  if (!key) {
    return (
      <div className="admin-container">
        <div className="admin-content-card" style={{ maxWidth: '400px', marginTop: '100px', padding: '40px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Admin Access</h2>
          <div className="admin-field" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#7A8AAE' }}>Secret Key</label>
            <input 
              type="password" 
              className="admin-search-input" 
              style={{ width: '100%' }}
              placeholder="Enter admin secret..."
              onKeyDown={(e) => e.key === 'Enter' && setKey(e.target.value)}
            />
          </div>
          <button 
            className="admin-btn admin-btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={(e) => setKey(e.target.previousSibling.querySelector('input').value)}
          >
            Access Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <Helmet>
        <title>Admin Dashboard | SCMmax</title>
      </Helmet>

      <header className="admin-header">
        <div className="admin-title-wrap">
          <h1>Download Analytics</h1>
          <p>Real-time tracking of whitepaper and agent overview requests</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchData}>
            <span>Refresh</span>
          </button>
          <button className="admin-btn admin-btn-primary" onClick={handleExportCSV}>
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Requests</div>
          <div className="admin-stat-value">{stats.total}</div>
          <div className="admin-stat-trend trend-up">↑ Live tracking</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Successful Downloads</div>
          <div className="admin-stat-value">{stats.downloaded}</div>
          <div className="admin-stat-trend" style={{ color: '#D9A94E' }}>
            {stats.total > 0 ? Math.round((stats.downloaded / stats.total) * 100) : 0}% Conversion
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Unique Prospects</div>
          <div className="admin-stat-value">{stats.unique}</div>
          <div className="admin-stat-trend trend-up">Qualified leads</div>
        </div>
      </div>

      <div className="admin-content-card">
        <div className="admin-table-controls">
          <input 
            type="text" 
            className="admin-search-input" 
            placeholder="Search by name, email or IP..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ color: '#7A8AAE', fontSize: '0.9rem' }}>
            Showing {filteredData.length} of {data.length} records
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">
            <p>Fetching latest data...</p>
          </div>
        ) : error ? (
          <div className="admin-error">
            <h3>Error loading data</h3>
            <p>{error}</p>
            <button className="admin-btn admin-btn-secondary" onClick={() => setKey('')} style={{ margin: '20px auto' }}>
              Reset Key
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="admin-empty">
            <p>No records found matching your search.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Downloaded At</th>
                  <th>IP Address</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{row.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#7A8AAE' }}>{row.email}</div>
                    </td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      <span className={`badge ${row.is_downloaded ? 'badge-success' : 'badge-pending'}`}>
                        {row.is_downloaded ? 'Downloaded' : 'Pending'}
                      </span>
                    </td>
                    <td>{formatDate(row.downloaded_at)}</td>
                    <td>{row.ip_address}</td>
                    <td style={{ textAlign: 'center' }}>{row.click_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin

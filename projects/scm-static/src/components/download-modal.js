import React, { useState } from 'react'
import './download-modal.css'

const DownloadModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/download-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'An error occurred. Please try again.')
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setEmail('')
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <div className="download-modal-overlay" onClick={handleClose}>
      <div className="download-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="download-modal-close" onClick={handleClose}>
          &times;
        </button>
        
        {success ? (
          <div className="download-modal-success">
            <h2>Success!</h2>
            <p>Verification successful! We have sent the download link for the Agent Overview to your email: <strong>{email}</strong>.</p>
            <button className="download-modal-button" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="download-modal-form" onSubmit={handleSubmit}>
            <h2>Download Agent Overview</h2>
            <p>Please enter your details to receive the download link.</p>
            
            <div className="download-modal-field">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Ex: John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="download-modal-field">
              <label>Work Email</label>
              <input 
                type="email" 
                placeholder="Ex: john@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            {error && <div className="download-modal-error">{error}</div>}
            
            <button 
              className="download-modal-button" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Validating...' : 'Get Download Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default DownloadModal

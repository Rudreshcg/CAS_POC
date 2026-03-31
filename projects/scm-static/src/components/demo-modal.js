import React from 'react'
import AgentCarousel from './agent-carousel'
import './demo-modal.css'

const DemoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose}>
          &times;
        </button>
        <div className="demo-modal-body">
          <AgentCarousel />
        </div>
      </div>
    </div>
  )
}

export default DemoModal

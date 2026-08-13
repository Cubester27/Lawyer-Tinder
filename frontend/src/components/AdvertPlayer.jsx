import React from 'react';
import { Film, Sparkles, Download, Flame } from 'lucide-react';

const VIDEO_PATH = '/Lawyer TInder_advert.mp4';

export function AdvertPlayerCard({ title = "Lawyer Tinder - Official Promo Video", className = "" }) {
  return (
    <div className={`card app-card shadow-lg overflow-hidden ${className}`}>
      <div className="card-header app-card-header d-flex align-items-center justify-content-between py-3">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger text-white px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 fs-7">
            <Film size={13} /> ADVERT
          </span>
          <h5 className="mb-0 fw-bold fs-6 fs-md-5">{title}</h5>
        </div>
        <span className="text-muted small d-none d-sm-inline">30 sec • 4K AI Showcase</span>
      </div>
      <div className="card-body p-0 position-relative bg-black text-center">
        <video 
          src={VIDEO_PATH} 
          controls 
          className="w-100 rounded-bottom shadow"
          style={{ maxHeight: '480px', objectFit: 'contain', backgroundColor: '#000' }}
          preload="metadata"
        >
          Your browser does not support playing HTML5 video.
        </video>
      </div>
      <div className="card-footer app-card-header text-muted small d-flex justify-content-between align-items-center px-3 py-2">
        <span className="d-inline-flex align-items-center gap-1">
          <Sparkles size={14} className="text-warning" /> Powered by AI Legal Matching & Management
        </span>
        <a 
          href={VIDEO_PATH} 
          download="Lawyer_Tinder_Advert.mp4" 
          className="btn btn-sm btn-outline-secondary py-0 fs-7 d-inline-flex align-items-center gap-1"
          title="Download Advertisement Video"
        >
          <Download size={13} /> Download MP4
        </a>
      </div>
    </div>
  );
}

export function AdvertModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1065 }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content app-card shadow-lg">
          <div className="modal-header app-card-header">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-danger text-white px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                <Flame size={14} /> ADVERT
              </span>
              <h5 className="modal-title fw-bold">Lawyer Tinder - Commercial</h5>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body p-0 bg-black text-center">
            <video 
              src={VIDEO_PATH} 
              controls 
              autoPlay 
              className="w-100"
              style={{ maxHeight: '75vh', objectFit: 'contain' }}
            >
              Your browser does not support HTML5 video.
            </video>
          </div>
          <div className="modal-footer app-card-header justify-content-between">
            <span className="text-muted small">AI-Powered Legal Matching & Document Automation</span>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvertPlayerCard;


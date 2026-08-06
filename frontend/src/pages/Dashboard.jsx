import { useState, useEffect } from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const isoMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}.${mm}.${yyyy}`;
  }
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  }
  return dateStr;
}

function Dashboard() {
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [currentDraft, setCurrentDraft] = useState('');
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [casesRes, lawyersRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/lawyers')
      ]);
      
      if (!casesRes.ok || !lawyersRes.ok) throw new Error('Failed to fetch data');
      
      const casesData = await casesRes.json();
      const lawyersData = await lawyersRes.json();
      
      setCases(casesData.cases || []);
      setLawyers(lawyersData.lawyers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const response = await fetch(`/api/cases/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      // Update local state
      setCases(cases.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  }

  function handleDownloadLetter(id) {
    window.open(`/api/cases/${id}/engagement-letter`, '_blank');
  }

  async function handleGenerateDraft(id) {
    setDraftModalOpen(true);
    setCurrentDraft('');
    setIsDraftLoading(true);
    
    try {
      const res = await fetch(`/api/cases/${id}/draft`, { method: 'POST' });
      const data = await res.json();
      setCurrentDraft(data.draft);
      
      // Update local state if we want to cache the draft
      setCases(cases.map(c => c.id === id ? { ...c, draft: data.draft } : c));
    } catch (err) {
      setCurrentDraft('Error generating draft. Please try again.');
    } finally {
      setIsDraftLoading(false);
    }
  }

  if (isLoading) {
    return <div className="text-center py-5 text-white">Loading cases...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white mb-0 fw-bold">👨‍⚖️ Lawyer Dashboard</h2>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs border-secondary mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link fw-bold ${activeTab === 'analytics' ? 'active bg-primary text-white border-primary' : 'text-slate-300 hover-white border-transparent'}`}
            onClick={() => setActiveTab('analytics')}
            style={activeTab === 'analytics' ? {} : { background: 'transparent' }}
          >
            📈 Performance Analytics
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link fw-bold ${activeTab === 'assignments' ? 'active bg-primary text-white border-primary' : 'text-slate-300 hover-white border-transparent'}`}
            onClick={() => setActiveTab('assignments')}
            style={activeTab === 'assignments' ? {} : { background: 'transparent' }}
          >
            📥 Recent Assignments
          </button>
        </li>
      </ul>
      
      {activeTab === 'analytics' && (
        <div className="fade-in">
        <h4 className="text-white mb-3 d-flex align-items-center gap-2">
          📈 Lawyer Performance Analytics
        </h4>
        <div className="row g-3">
          {lawyers.map(lawyer => (
            <div key={lawyer.id} className="col-md-6 col-lg-4">
              <div className="app-card p-3 border-0 shadow-sm h-100" style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px' }}>
                <h6 className="fw-bold text-white mb-1">{lawyer.name}</h6>
                <div className="text-slate-400 small mb-3">Total Cases Handled: <strong className="text-white fs-6">{lawyer.caseHistory}</strong></div>
                
                {lawyer.performance && Object.entries(lawyer.performance).map(([area, stats]) => (
                  <div key={area} className="d-flex justify-content-between align-items-center mb-2 small pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-slate-300 fw-medium text-truncate me-2" style={{ maxWidth: '120px' }} title={area}>{area}</span>
                    <div className="d-flex gap-2">
                      <span className="badge bg-dark border border-secondary text-slate-300">{stats.cases} cases</span>
                      <span className={`badge ${stats.successRate >= 80 ? 'bg-success' : 'bg-warning text-dark'}`}>{stats.successRate}% Success</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="fade-in">
      {cases.length === 0 ? (
        <div className="text-center py-5 text-secondary">
          No cases assigned yet.
        </div>
      ) : (
        <div className="row g-4">
          {cases.slice().reverse().map(c => (
            <div key={c.id} className="col-md-6 col-lg-4">
              <div className="app-card h-100 border-0 shadow d-flex flex-column" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)' }}>
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-white mb-0">{c.caseTitle}</h5>
                    <span className={`badge ${c.status === 'Accepted' ? 'bg-success' : c.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      {c.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="text-slate-400 small mb-3">
                    Assigned to: <strong className="text-white">{c.selectedLawyer}</strong>
                  </div>
                  
                  {c.caseDetails && (
                    <>
                      <div className="law-code-badge fs-6 mb-3 w-100 justify-content-center" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                        📜 {c.caseDetails.applicableCode}
                      </div>
                      <p className="text-slate-300 small mb-4" style={{ flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.caseDetails.summary}
                      </p>
                      
                      {c.caseDetails.primaryDeadlineDate && (
                        <div className="mb-3">
                          <span className="deadline-date-pill small">
                            📅 Deadline: {formatDate(c.caseDetails.primaryDeadlineDate)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="mt-auto pt-3 border-top border-secondary d-flex gap-2">
                    <button 
                      onClick={() => updateStatus(c.id, 'Accepted')}
                      disabled={c.status === 'Accepted'}
                      className="btn btn-sm btn-outline-success flex-grow-1 fw-bold"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => updateStatus(c.id, 'Rejected')}
                      disabled={c.status === 'Rejected'}
                      className="btn btn-sm btn-outline-danger flex-grow-1 fw-bold"
                    >
                      Reject
                    </button>
                  </div>
                  
                  {c.status === 'Accepted' && (
                    <div className="mt-3 d-flex flex-column gap-2 pt-3" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                      <button 
                        onClick={() => handleDownloadLetter(c.id)}
                        className="btn btn-sm btn-outline-info w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                      >
                        📄 Download Engagement Letter
                      </button>
                      <button 
                        onClick={() => handleGenerateDraft(c.id)}
                        className="btn btn-sm btn-outline-warning w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                      >
                        ✍️ Generate First Draft
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      )}

      {/* Draft Modal */}
      {draftModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ background: '#0f172a' }}>
              <div className="modal-header border-secondary border-opacity-25 py-3">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  ✍️ AI Legal Draft
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDraftModalOpen(false)}></button>
              </div>
              <div className="modal-body p-4 text-slate-300" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {isDraftLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <div className="mt-3 fw-medium text-white fs-5">AI is drafting the document...</div>
                    <div className="text-secondary small mt-1">Analyzing case facts and applying legal frameworks</div>
                  </div>
                ) : (
                  currentDraft
                )}
              </div>
              <div className="modal-footer border-secondary border-opacity-25 py-2">
                <button type="button" className="btn btn-outline-light px-4" onClick={() => setDraftModalOpen(false)}>Close</button>
                {!isDraftLoading && currentDraft && (
                  <button type="button" className="btn btn-primary px-4" onClick={() => {
                    const blob = new Blob([currentDraft], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Legal_Draft.md';
                    a.click();
                  }}>💾 Download .md</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

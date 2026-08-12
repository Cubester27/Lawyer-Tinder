import { useState, useEffect } from 'react';
import { AdvertPlayerCard } from '../components/AdvertPlayer';

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
  
  // AI Draft Modal & Tone state
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [currentDraft, setCurrentDraft] = useState('');
  const [currentTone, setCurrentTone] = useState('standard');
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  // AI Verification state
  const [verificationData, setVerificationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // AI Case Risk & Strategy state
  const [riskMap, setRiskMap] = useState({});
  const [expandedRiskId, setExpandedRiskId] = useState(null);
  const [loadingRiskId, setLoadingRiskId] = useState(null);

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
      
      setCases(cases.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  }

  function handleDownloadLetter(id) {
    window.open(`/api/cases/${id}/engagement-letter`, '_blank');
  }

  function handleDownloadIcs(id) {
    window.open(`/api/cases/${id}/ics`, '_blank');
  }

  async function handleGenerateDraft(id, tone = 'standard') {
    setActiveCaseId(id);
    setDraftModalOpen(true);
    setCurrentDraft('');
    setCurrentTone(tone);
    setVerificationData(null);
    setIsDraftLoading(true);
    
    try {
      const res = await fetch(`/api/cases/${id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, forceRegenerate: tone !== 'standard' })
      });
      const data = await res.json();
      setCurrentDraft(data.draft);
      
      setCases(cases.map(c => c.id === id ? { ...c, draft: data.draft } : c));
    } catch (err) {
      setCurrentDraft('Error generating draft. Please try again.');
    } finally {
      setIsDraftLoading(false);
    }
  }

  async function handleVerifyDraft() {
    if (!activeCaseId || !currentDraft) return;
    setIsVerifying(true);
    setVerificationData(null);
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/verify-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: currentDraft })
      });
      const data = await res.json();
      setVerificationData(data.verification);
    } catch (err) {
      alert('Failed to audit AI factuality.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleToggleRiskAnalysis(id) {
    if (expandedRiskId === id) {
      setExpandedRiskId(null);
      return;
    }

    setExpandedRiskId(id);
    if (!riskMap[id]) {
      setLoadingRiskId(id);
      try {
        const res = await fetch(`/api/cases/${id}/risk-analysis`, { method: 'POST' });
        const data = await res.json();
        setRiskMap(prev => ({ ...prev, [id]: data.riskAnalysis }));
      } catch (err) {
        console.error('Failed to load risk analysis', err);
      } finally {
        setLoadingRiskId(null);
      }
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
            📥 Recent Assignments ({cases.length})
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
              {cases.slice().reverse().map(c => {
                const risk = riskMap[c.id];
                const isRiskExpanded = expandedRiskId === c.id;
                const isRiskLoading = loadingRiskId === c.id;

                return (
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
                            <p className="text-slate-300 small mb-3" style={{ flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {c.caseDetails.summary}
                            </p>
                            
                            {(c.caseDetails.primaryDeadlineDate || c.caseDetails.deadlines?.length > 0) && (
                              <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <span className="deadline-date-pill small">
                                  📅 Deadline: {formatDate(c.caseDetails.primaryDeadlineDate || c.caseDetails.deadlines[0]?.date)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadIcs(c.id)}
                                  className="btn btn-xs btn-outline-warning py-1 px-2 fw-bold d-flex align-items-center gap-1"
                                  style={{ fontSize: '0.75rem', borderRadius: '12px' }}
                                  title="Download .ics Calendar File"
                                >
                                  📅 .ics
                                </button>
                              </div>
                            )}

                            {/* 🤖 AI Risk & Win Probability Toggle Button */}
                            <button
                              onClick={() => handleToggleRiskAnalysis(c.id)}
                              className="btn btn-sm btn-dark border-secondary w-100 mb-3 text-info fw-bold d-flex align-items-center justify-content-between px-3"
                              style={{ borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)' }}
                            >
                              <span>🤖 AI Risk & Win Strategy</span>
                              <span>{isRiskExpanded ? '▲' : '▼'}</span>
                            </button>

                            {/* Expanded Risk Drawer */}
                            {isRiskExpanded && (
                              <div className="p-3 mb-3 border border-secondary border-opacity-50 rounded bg-dark text-slate-300 fade-in" style={{ fontSize: '0.82rem' }}>
                                {isRiskLoading ? (
                                  <div className="text-center py-2 text-info">
                                    <span className="spinner-border spinner-border-sm me-2"></span> Evaluating win probability & opponent strategy...
                                  </div>
                                ) : risk ? (
                                  <div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <span className="fw-bold text-white">Win Probability:</span>
                                      <span className={`badge ${risk.winProbability >= 75 ? 'bg-success' : risk.winProbability >= 60 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                        🎯 {risk.winProbability}%
                                      </span>
                                    </div>
                                    <div className="progress mb-2" style={{ height: '6px', background: '#334155' }}>
                                      <div className={`progress-bar ${risk.winProbability >= 75 ? 'bg-success' : risk.winProbability >= 60 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${risk.winProbability}%` }}></div>
                                    </div>

                                    <div className="mb-2">
                                      <strong className="text-success">💪 Strengths:</strong>
                                      <ul className="ps-3 mb-1 mt-1 text-slate-300">
                                        {risk.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                                      </ul>
                                    </div>

                                    <div className="mb-2">
                                      <strong className="text-danger">⚠️ Vulnerabilities:</strong>
                                      <ul className="ps-3 mb-1 mt-1 text-slate-300">
                                        {risk.vulnerabilities.map((v, idx) => <li key={idx}>{v}</li>)}
                                      </ul>
                                    </div>

                                    <div>
                                      <strong className="text-warning">⚔️ Opponent Strategy Forecast:</strong>
                                      <p className="mb-0 text-slate-300 mt-1 italic" style={{ fontSize: '0.8rem' }}>"{risk.opponentStrategy}"</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted">No risk analysis available.</div>
                                )}
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
                              onClick={() => handleGenerateDraft(c.id, 'standard')}
                              className="btn btn-sm btn-outline-warning w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                            >
                              ✍️ AI Notice Draft & Transformer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🎭 AI Multi-Tone Draft & Fact Verification Modal */}
      {draftModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ background: '#0f172a' }}>
              
              {/* Modal Header */}
              <div className="modal-header border-secondary border-opacity-25 py-3">
                <div>
                  <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2 mb-0">
                    ✍️ AI Legal Draft & Persona Transformer
                  </h5>
                  <small className="text-slate-400">Transform draft tone or audit AI factual precision</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDraftModalOpen(false)}></button>
              </div>

              {/* 🎭 AI Tone Selector Bar */}
              <div className="px-4 pt-3 pb-2 border-bottom border-secondary border-opacity-25 bg-dark">
                <label className="text-slate-400 small fw-bold mb-2 d-block">SELECT AI DRAFT TONE / PERSONA:</label>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'standard')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm ${currentTone === 'standard' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                  >
                    📜 Standard Notice
                  </button>
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'aggressive')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm ${currentTone === 'aggressive' ? 'btn-danger' : 'btn-outline-danger text-slate-300'}`}
                  >
                    ⚡ Aggressive Demand
                  </button>
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'diplomatic')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm ${currentTone === 'diplomatic' ? 'btn-success' : 'btn-outline-success text-slate-300'}`}
                  >
                    🤝 Diplomatic Settlement
                  </button>
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'plain_english')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm ${currentTone === 'plain_english' ? 'btn-warning text-dark' : 'btn-outline-warning text-slate-300'}`}
                  >
                    🗣️ Plain English Client Summary
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 text-slate-300" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: '1.6' }}>
                {isDraftLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <div className="mt-3 fw-medium text-white fs-5">AI is generating draft in <strong>{currentTone.replace('_', ' ')}</strong> tone...</div>
                    <div className="text-secondary small mt-1">Conditioning LLM prompt persona and legal principles</div>
                  </div>
                ) : (
                  <div className='text-white'>
                    {currentDraft}

                    {/* 🔍 AI Fact Verification Guardrail Output */}
                    {verificationData && (
                      <div className="mt-4 p-3 rounded border border-info bg-dark text-slate-200 fade-in" style={{ fontFamily: 'sans-serif' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-info d-flex align-items-center gap-2 fs-6">
                            🛡️ AI Factuality Audit Score:
                          </strong>
                          <span className={`badge fs-6 ${verificationData.confidenceScore >= 90 ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {verificationData.confidenceScore}% Verified
                          </span>
                        </div>
                        <ul className="ps-3 mb-2 small text-slate-300">
                          {verificationData.auditNotes?.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                        {verificationData.potentialHallucinations?.length > 0 && (
                          <div className="alert alert-warning py-1 px-2 mb-0 small">
                            <strong>⚠️ Flagged Discrepancies:</strong>
                            <ul className="mb-0 ps-3">
                              {verificationData.potentialHallucinations.map((h, idx) => <li key={idx}>{h}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-secondary border-opacity-25 py-2 d-flex justify-content-between">
                <div>
                  {!isDraftLoading && currentDraft && (
                    <button
                      type="button"
                      onClick={handleVerifyDraft}
                      disabled={isVerifying}
                      className="btn btn-outline-info btn-sm fw-bold d-flex align-items-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span> Auditing Facts...
                        </>
                      ) : (
                        <>🔍 Check AI Factuality Guardrail</>
                      )}
                    </button>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-light px-4" onClick={() => setDraftModalOpen(false)}>Close</button>
                  {!isDraftLoading && currentDraft && (
                    <button type="button" className="btn btn-primary px-4" onClick={() => {
                      const blob = new Blob([currentDraft], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Legal_Notice_${activeCaseId || 'Draft'}_${currentTone}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      📥 Download (.md)
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

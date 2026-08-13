import { useState, useEffect } from 'react';
import { 
  Gavel, 
  TrendingUp, 
  Inbox, 
  FileText, 
  Calendar, 
  Brain, 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  Swords, 
  FileDown, 
  FileEdit, 
  Zap, 
  Handshake, 
  MessageSquare, 
  SearchCheck, 
  Download,
  Eye
} from 'lucide-react';
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
  
  // Case Detail Modal state
  const [selectedCaseModal, setSelectedCaseModal] = useState(null);
  const [selectedLawyerModal, setSelectedLawyerModal] = useState(null);

  // AI Draft Modal & Tone state
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [currentDraft, setCurrentDraft] = useState('');
  const [currentTone, setCurrentTone] = useState('standard');
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  // AI Verification state
  const [verificationData, setVerificationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

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

  const openCaseDetails = (c) => {
    setSelectedCaseModal(c);
  };

  if (isLoading) {
    return <div className="text-center py-5 text-muted">Loading cases...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold d-flex align-items-center gap-2">
          <Gavel size={26} className="text-primary" /> Dashboard
        </h2>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link fw-bold d-inline-flex align-items-center gap-1 ${activeTab === 'analytics' ? 'active bg-primary text-white border-primary' : 'text-body border-transparent'}`}
            onClick={() => setActiveTab('analytics')}
            style={activeTab === 'analytics' ? {} : { background: 'transparent' }}
          >
            <TrendingUp size={16} /> Performance Analytics
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link fw-bold d-inline-flex align-items-center gap-1 ${activeTab === 'assignments' ? 'active bg-primary text-white border-primary' : 'text-body border-transparent'}`}
            onClick={() => setActiveTab('assignments')}
            style={activeTab === 'assignments' ? {} : { background: 'transparent' }}
          >
            <Inbox size={16} /> Recent Assignments ({cases.length})
          </button>
        </li>
      </ul>
      
      {activeTab === 'analytics' && (
        <div className="fade-in">
          <h4 className="mb-3 d-flex align-items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Lawyer Performance Analytics
          </h4>
          {/* Desktop Table View */}
          <div className="app-card shadow overflow-hidden d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="app-card-header">
                  <tr>
                    <th className="py-3 px-4">Lawyer</th>
                    <th className="py-3 px-3">Primary Practice Areas</th>
                    <th className="py-3 px-3 text-center">Cases Handled</th>
                    <th className="py-3 px-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lawyers.map(lawyer => (
                    <tr 
                      key={lawyer.id} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedLawyerModal(lawyer)}
                    >
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={lawyer.avatarUrl || `/lawyers/lawyer-${lawyer.id}.jpg`}
                            alt={lawyer.name}
                            className="lawyer-avatar-md shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(lawyer.name)}&background=e6b729&color=112827&bold=true`;
                            }}
                          />
                          <div>
                            <div className="fw-bold fs-6" style={{ color: 'var(--text-main)' }}>{lawyer.name}</div>
                            <div className="text-muted small">{lawyer.jurisdictions?.join(', ') || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="d-flex flex-wrap gap-1">
                          {lawyer.practiceAreas?.slice(0, 2).map((pa, idx) => (
                            <span key={idx} className="badge bg-secondary bg-opacity-20 text-body border" style={{ fontSize: '0.75rem' }}>
                              {pa}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="badge bg-primary text-body fw-bold px-3 py-2" style={{ fontSize: '0.85rem' }}>
                          {lawyer.caseHistory} Cases
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <button 
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLawyerModal(lawyer);
                          }}
                          style={{ borderColor: 'var(--text-main)', color: 'var(--text-main)' }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="d-md-none d-flex flex-column gap-3">
            {lawyers.map(lawyer => (
              <div
                key={lawyer.id}
                className="app-card shadow-sm p-3 rounded-3 border"
                style={{ cursor: 'pointer', borderColor: 'var(--border-card)' }}
                onClick={() => setSelectedLawyerModal(lawyer)}
              >
                <div className="d-flex align-items-center gap-3 mb-2">
                  <img
                    src={lawyer.avatarUrl || `/lawyers/lawyer-${lawyer.id}.jpg`}
                    alt={lawyer.name}
                    className="lawyer-avatar-md shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(lawyer.name)}&background=e6b729&color=112827&bold=true`;
                    }}
                  />
                  <div className="flex-grow-1 overflow-hidden">
                    <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text-main)' }}>{lawyer.name}</h6>
                    <div className="text-muted small">{lawyer.jurisdictions?.join(', ') || 'General'}</div>
                  </div>
                  <span className="badge bg-primary text-body fw-bold py-1 px-2" style={{ fontSize: '0.75rem' }}>
                    {lawyer.caseHistory} Cases
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-1 mb-3">
                  {lawyer.practiceAreas?.map((pa, idx) => (
                    <span key={idx} className="badge bg-secondary bg-opacity-20 text-body border" style={{ fontSize: '0.7rem' }}>
                      {pa}
                    </span>
                  ))}
                </div>
                <button
                  className="btn btn-sm btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center gap-1 fw-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLawyerModal(lawyer);
                  }}
                >
                  <Eye size={14} /> View Analytics & Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="fade-in">
          {cases.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No cases assigned yet.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="app-card shadow overflow-hidden d-none d-lg-block">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="app-card-header">
                      <tr>
                        <th className="py-3 px-4">Case Title</th>
                        <th className="py-3 px-3">Client</th>
                        <th className="py-3 px-3">Assigned Lawyer</th>
                        <th className="py-3 px-3">Governing Law</th>
                        <th className="py-3 px-3">Deadline</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.slice().reverse().map(c => {
                        const details = typeof c.caseDetails === 'string' ? JSON.parse(c.caseDetails) : (c.caseDetails || {});
                        const governingLaw = details.applicableCode || c.applicableCode || details.governingLaw || c.governingLaw || 'General Code';
                        const clientName = details.clientName || c.clientName || 'N/A';
                        const primaryDate = details.primaryDeadlineDate || details.deadlines?.[0]?.date || c.primaryDeadlineDate;

                        return (
                          <tr 
                            key={c.id} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => openCaseDetails(c)}
                          >
                            <td className="py-3 px-4">
                              <div className="fw-bold">{c.caseTitle}</div>
                              <div className="text-muted small">{details.caseFocus || details.practiceArea || 'General Litigation'}</div>
                            </td>
                            <td className="py-3 px-3 fw-medium">
                              {clientName}
                            </td>
                            <td className="py-3 px-3">
                              <div className="d-flex align-items-center gap-2">
                                <img
                                  src={c.lawyerAvatar || (c.lawyerId ? `/lawyers/lawyer-${c.lawyerId}.jpg` : `/lawyers/lawyer-${lawyers.find(l => l.name === c.selectedLawyer)?.id || 1}.jpg`)}
                                  alt={c.selectedLawyer}
                                  className="lawyer-avatar-sm shadow-sm"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.selectedLawyer || 'Lawyer')}&background=e6b729&color=112827&bold=true`;
                                  }}
                                />
                                <span className="fw-medium text-truncate" style={{ maxWidth: '140px' }}>{c.selectedLawyer}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="badge bg-primary text-white border border-primary border-opacity-30 px-2 py-1" style={{ fontSize: '0.8rem' }}>
                                <FileText size={12} className="me-1" />
                                {governingLaw}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {primaryDate ? (
                                <span className="deadline-date-pill small d-inline-flex align-items-center gap-1">
                                  <Calendar size={13} /> {formatDate(primaryDate)}
                                </span>
                              ) : (
                                <span className="text-muted small">No deadline</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`badge ${c.status === 'Accepted' ? 'bg-success' : c.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {c.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-end">
                              <button 
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCaseDetails(c);
                                }}
                              >
                                <Eye size={14} /> Open Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card List View (d-lg-none) */}
              <div className="d-lg-none d-flex flex-column gap-3">
                {cases.slice().reverse().map(c => {
                  const details = typeof c.caseDetails === 'string' ? JSON.parse(c.caseDetails) : (c.caseDetails || {});
                  const governingLaw = details.applicableCode || c.applicableCode || details.governingLaw || c.governingLaw || 'General Code';
                  const clientName = details.clientName || c.clientName || 'N/A';
                  const primaryDate = details.primaryDeadlineDate || details.deadlines?.[0]?.date || c.primaryDeadlineDate;

                  return (
                    <div 
                      key={c.id} 
                      className="app-card shadow-sm p-3 rounded-3 border"
                      style={{ cursor: 'pointer', borderColor: 'var(--border-card)' }}
                      onClick={() => openCaseDetails(c)}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="flex-grow-1 overflow-hidden">
                          <h6 className="fw-bold mb-1 text-truncate" style={{ color: 'var(--text-main)' }}>{c.caseTitle}</h6>
                          <div className="text-muted small">{details.caseFocus || details.practiceArea || 'General Litigation'}</div>
                        </div>
                        <span className={`badge flex-shrink-0 ${c.status === 'Accepted' ? 'bg-success' : c.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '0.75rem' }}>
                          {c.status || 'Pending'}
                        </span>
                      </div>

                      {/* Attorney & Client Info Box */}
                      <div className="p-2 rounded-2 mb-3" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-card)' }}>
                        <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                          <img
                            src={c.lawyerAvatar || (c.lawyerId ? `/lawyers/lawyer-${c.lawyerId}.jpg` : `/lawyers/lawyer-${lawyers.find(l => l.name === c.selectedLawyer)?.id || 1}.jpg`)}
                            alt={c.selectedLawyer}
                            className="lawyer-avatar-sm shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.selectedLawyer || 'Lawyer')}&background=e6b729&color=112827&bold=true`;
                            }}
                          />
                          <div className="overflow-hidden">
                            <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Assigned Attorney</div>
                            <div className="fw-bold small text-truncate" style={{ color: 'var(--text-main)' }}>{c.selectedLawyer}</div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center small">
                          <span className="text-muted">Client:</span>
                          <span className="fw-medium text-truncate ms-2" style={{ maxWidth: '200px' }}>{clientName}</span>
                        </div>
                      </div>

                      {/* Badges: Law and Deadline */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <span className="badge bg-primary text-white border border-primary border-opacity-30 px-2 py-1" style={{ fontSize: '0.75rem' }}>
                          <FileText size={12} className="me-1" />
                          {governingLaw}
                        </span>
                        {primaryDate ? (
                          <span className="deadline-date-pill small d-inline-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                            <Calendar size={12} /> {formatDate(primaryDate)}
                          </span>
                        ) : (
                          <span className="text-muted small">No deadline</span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button 
                        className="btn btn-sm btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center gap-1 fw-semibold py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCaseDetails(c);
                        }}
                      >
                        <Eye size={14} /> Open Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCaseModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content app-card shadow-lg">
              
              {/* Modal Header */}
              <div className="modal-header app-card-header py-3">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <Gavel size={20} className="text-primary" /> {selectedCaseModal.caseTitle}
                  </h5>
                  <span className={`badge ${selectedCaseModal.status === 'Accepted' ? 'bg-success' : selectedCaseModal.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                    {selectedCaseModal.status || 'Pending'}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedCaseModal(null)}></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {/* Metadata Grid */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6 col-lg-3">
                    <div className="app-card p-2 rounded">
                      <label className="text-muted small mb-0 d-block text-uppercase">Client Name</label>
                      <span className="fw-bold fs-6">{selectedCaseModal.caseDetails?.clientName || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="app-card p-2 rounded d-flex align-items-center gap-2">
                      <img
                        src={selectedCaseModal.lawyerAvatar || (selectedCaseModal.lawyerId ? `/lawyers/lawyer-${selectedCaseModal.lawyerId}.jpg` : `/lawyers/lawyer-${lawyers.find(l => l.name === selectedCaseModal.selectedLawyer)?.id || 1}.jpg`)}
                        alt={selectedCaseModal.selectedLawyer}
                        className="lawyer-avatar-sm shadow-sm"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCaseModal.selectedLawyer || 'Lawyer')}&background=e6b729&color=112827&bold=true`;
                        }}
                      />
                      <div className="overflow-hidden">
                        <label className="text-muted small mb-0 d-block text-uppercase" style={{ fontSize: '0.7rem' }}>Assigned Attorney</label>
                        <span className="fw-bold fs-6 text-truncate d-block" title={selectedCaseModal.selectedLawyer}>{selectedCaseModal.selectedLawyer}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="app-card p-2 rounded">
                      <label className="text-muted small mb-0 d-block text-uppercase">Practice Area</label>
                      <span className="fw-bold fs-6">{selectedCaseModal.caseDetails?.practiceArea || 'General Litigation'}</span>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="app-card p-2 rounded">
                      <label className="text-muted small mb-0 d-block text-uppercase">Jurisdiction</label>
                      <span className="fw-bold fs-6">{selectedCaseModal.caseDetails?.jurisdiction || 'Germany'}</span>
                    </div>
                  </div>
                </div>

                {/* Legal Code & Summary */}
                {selectedCaseModal.caseDetails && (
                  <>
                    <div className="law-code-card mb-4 shadow-sm">
                      <div className="text-uppercase small fw-bold mb-2 text-primary">Applicable Legal Code</div>
                      <div className="law-code-badge fs-6 mb-0 w-100 justify-content-center">
                        <FileText size={16} /> {selectedCaseModal.caseDetails.applicableCode || 'No code detected'}
                      </div>
                    </div>

                    {selectedCaseModal.caseDetails.summary && (
                      <div className="mb-4">
                        <h6 className="fw-bold d-flex align-items-center gap-2 mb-2">
                          <FileText size={16} className="text-primary" /> Case Summary
                        </h6>
                        <div className="p-3 app-card rounded small">
                          {selectedCaseModal.caseDetails.summary}
                        </div>
                      </div>
                    )}

                    {/* Key Deadlines */}
                    {(selectedCaseModal.caseDetails.primaryDeadlineDate || selectedCaseModal.caseDetails.deadlines?.length > 0) && (
                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-bold d-flex align-items-center gap-2 mb-0">
                            <Calendar size={16} className="text-danger" /> Key Deadlines
                          </h6>
                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(selectedCaseModal.id)}
                            className="btn btn-sm btn-outline-warning py-1 px-2 fw-bold d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.78rem', borderRadius: '12px' }}
                          >
                            <Calendar size={13} /> Export All (.ics)
                          </button>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          {selectedCaseModal.caseDetails.deadlines?.map((dl, idx) => (
                            <div key={idx} className="deadline-card p-3 d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold">{dl.label || 'Statutory Deadline'}</div>
                                {dl.sourceText && <div className="text-muted small fst-italic">"{dl.sourceText}"</div>}
                              </div>
                              <span className="deadline-date-pill small d-inline-flex align-items-center gap-1">
                                <Calendar size={13} /> {formatDate(dl.date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer / Action Bar */}
              <div className="modal-footer app-card-header py-3 d-flex justify-content-between flex-wrap gap-2">
                <div className="d-flex gap-2">
                  <button 
                    onClick={() => {
                      updateStatus(selectedCaseModal.id, 'Accepted');
                      setSelectedCaseModal(prev => prev ? { ...prev, status: 'Accepted' } : null);
                    }}
                    disabled={selectedCaseModal.status === 'Accepted'}
                    className="btn btn-sm btn-outline-success fw-bold px-3"
                  >
                    Accept Case
                  </button>
                  <button 
                    onClick={() => {
                      updateStatus(selectedCaseModal.id, 'Rejected');
                      setSelectedCaseModal(prev => prev ? { ...prev, status: 'Rejected' } : null);
                    }}
                    disabled={selectedCaseModal.status === 'Rejected'}
                    className="btn btn-sm btn-outline-danger fw-bold px-3"
                  >
                    Reject Case
                  </button>
                </div>

                <div className="d-flex gap-2 align-items-center">
                  {selectedCaseModal.status === 'Accepted' && (
                    <>
                      <button 
                        onClick={() => handleDownloadLetter(selectedCaseModal.id)}
                        className="btn btn-sm btn-outline-info fw-bold d-inline-flex align-items-center gap-1"
                      >
                        <FileDown size={15} /> Engagement Letter
                      </button>
                      <button 
                        onClick={() => {
                          const cId = selectedCaseModal.id;
                          setSelectedCaseModal(null);
                          handleGenerateDraft(cId, 'standard');
                        }}
                        className="btn btn-sm btn-outline-warning fw-bold d-inline-flex align-items-center gap-1"
                      >
                        <FileEdit size={15} /> AI Notice Draft
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn-sm btn-secondary px-3" onClick={() => setSelectedCaseModal(null)}>
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* AI Multi-Tone Draft & Fact Verification Modal */}
      {draftModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content app-card shadow-lg">
              
              {/* Modal Header */}
              <div className="modal-header app-card-header py-3">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <FileEdit size={20} className="text-primary" /> AI Legal Draft & Persona Transformer
                  </h5>
                  <small className="text-muted">Transform draft tone or audit AI factual precision</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setDraftModalOpen(false)}></button>
              </div>

              {/* AI Tone Selector Bar */}
              <div className="px-4 pt-3 pb-2 border-bottom app-card-header">
                <label className="text-muted small fw-bold mb-2 d-block">SELECT AI DRAFT TONE / PERSONA:</label>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'standard')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${currentTone === 'standard' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    <FileText size={14} /> Standard Notice
                  </button>
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'aggressive')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${currentTone === 'aggressive' ? 'btn-danger' : 'btn-outline-danger'}`}
                  >
                    <Zap size={14} /> Aggressive Demand
                  </button>
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'diplomatic')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${currentTone === 'diplomatic' ? 'btn-success' : 'btn-outline-success'}`}
                  >
                    <Handshake size={14} /> Diplomatic Settlement
                  </button>
                  <button
                    onClick={() => handleGenerateDraft(activeCaseId, 'plain_english')}
                    disabled={isDraftLoading}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${currentTone === 'plain_english' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                  >
                    <MessageSquare size={14} /> Plain English Client Summary
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: '1.6' }}>
                {isDraftLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <div className="mt-3 fw-medium fs-5">AI is generating draft in <strong>{currentTone.replace('_', ' ')}</strong> tone...</div>
                    <div className="text-muted small mt-1">Conditioning LLM prompt persona and legal principles</div>
                  </div>
                ) : (
                  <div>
                    {currentDraft}

                    {/* AI Fact Verification Guardrail Output */}
                    {verificationData && (
                      <div className="mt-4 p-3 rounded border border-info app-card fade-in" style={{ fontFamily: 'sans-serif' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-info d-flex align-items-center gap-2 fs-6">
                            <ShieldCheck size={18} className="text-info" /> AI Factuality Audit Score:
                          </strong>
                          <span className={`badge fs-6 ${verificationData.confidenceScore >= 90 ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {verificationData.confidenceScore}% Verified
                          </span>
                        </div>
                        <ul className="ps-3 mb-2 small text-muted">
                          {verificationData.auditNotes?.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                        {verificationData.potentialHallucinations?.length > 0 && (
                          <div className="alert alert-warning py-1 px-2 mb-0 small">
                            <strong className="d-inline-flex align-items-center gap-1">
                              <AlertTriangle size={15} /> Flagged Discrepancies:
                            </strong>
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
              <div className="modal-footer app-card-header py-2 d-flex justify-content-between">
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
                        <><SearchCheck size={16} /> Check AI Factuality Guardrail</>
                      )}
                    </button>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setDraftModalOpen(false)}>Close</button>
                  {!isDraftLoading && currentDraft && (
                    <button type="button" className="btn btn-primary px-4 d-inline-flex align-items-center gap-1" onClick={() => {
                      const blob = new Blob([currentDraft], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Legal_Notice_${activeCaseId || 'Draft'}_${currentTone}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      <Download size={16} /> Download (.md)
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* Lawyer Detail Modal */}
      {selectedLawyerModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content app-card shadow-lg border">
              <div className="modal-header app-card-header py-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--text-main)' }}>
                  <TrendingUp size={20} style={{ color: 'var(--text-main)' }} /> Attorney Profile & Analytics
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLawyerModal(null)}></button>
              </div>
              <div className="modal-body p-4">
                {/* Attorney Profile Header */}
                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 app-card border" style={{ borderColor: 'var(--border-card)' }}>
                  <img
                    src={selectedLawyerModal.avatarUrl || `/lawyers/lawyer-${selectedLawyerModal.id}.jpg`}
                    alt={selectedLawyerModal.name}
                    className="lawyer-avatar-lg shadow"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLawyerModal.name)}&background=e6b729&color=112827&bold=true`;
                    }}
                  />
                  <div className="flex-grow-1 overflow-hidden">
                    <h4 className="fw-bold mb-1 text-truncate" style={{ color: 'var(--text-main)' }}>{selectedLawyerModal.name}</h4>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {selectedLawyerModal.practiceAreas?.map((pa, idx) => (
                        <span key={idx} className="badge bg-secondary bg-opacity-20 text-body border" style={{ fontSize: '0.72rem' }}>
                          {pa}
                        </span>
                      ))}
                    </div>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      <span>Total Cases: <strong style={{ color: 'var(--text-main)' }}>{selectedLawyerModal.caseHistory}</strong></span>
                      {selectedLawyerModal.workload && (
                        <span>Workload: <strong style={{ color: 'var(--text-main)' }}>{selectedLawyerModal.workload} active</strong></span>
                      )}
                    </div>
                  </div>
                </div>
                
                <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--text-main)' }}>Performance by Practice Area</h6>
                {selectedLawyerModal.performance && Object.entries(selectedLawyerModal.performance).map(([area, stats]) => (
                  <div key={area} className="d-flex justify-content-between align-items-center mb-3 p-3 app-card rounded border" style={{ borderColor: 'var(--border-card)' }}>
                    <span className="fw-bold" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{area}</span>
                    <div className="d-flex gap-2">
                      <span className="badge bg-secondary bg-opacity-20 text-body border p-2" style={{ fontSize: '0.85rem' }}>{stats.cases} cases</span>
                      <span className={`badge p-2 ${stats.successRate >= 80 ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.85rem' }}>{stats.successRate}% Success</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer app-card-header py-2">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setSelectedLawyerModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;



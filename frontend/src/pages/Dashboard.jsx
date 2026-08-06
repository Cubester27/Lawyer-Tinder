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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cases');
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      setCases(data.cases || []);
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

  if (isLoading) {
    return <div className="text-center py-5 text-white">Loading cases...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  return (
    <div className="container py-4">
      <h2 className="text-white mb-4 fw-bold">👨‍⚖️ Lawyer Dashboard</h2>
      
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

import { useState } from 'react';

function App() {
  const DEMO_CASES = [
    {
      label: 'Employment',
      text: 'An employee was terminated without notice. Under the Employment Protection Act (KSchG) and Working Hours Act (ArbZG), a legal complaint must be filed. The brief submission deadline ends on 2026-08-25.'
    },
    {
      label: 'Medical Malpractice',
      text: 'Patient suffered severe injuries due to a surgical error at the Munich Hospital. We are pursuing a medical malpractice claim under the BGB. The statute of limitations for the claim expires on 2027-01-15.'
    },
    {
      label: 'Commercial (HGB)',
      text: 'Breach of contract regarding a commercial goods delivery. The supplier failed to deliver on time. We need to file a lawsuit under the HGB. The hearing date is set for 2026-10-10.'
    },
    {
      label: 'Criminal',
      text: 'Client is accused of theft and fraud under the StGB. The police have issued an arrest warrant. We need to prepare for the court hearing scheduled for 2026-09-12.'
    },
    {
      label: 'Data Protection',
      text: 'A company leaked user data. We are filing a claim based on the DSGVO (GDPR). The data protection authority must be notified by 2026-09-01.'
    }
  ];

  const [rawText, setRawText] = useState('');
  const [caseInput, setCaseInput] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [notes, setNotes] = useState('Urgent deadline - Please prioritize case intake.');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleAnalyzeText(text = rawText) {
    if (!text.trim()) return;
    setIsLoading(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName: 'Input Legal Text' })
      });
      const data = await response.json();
      if (data.caseInput) {
        setCaseInput(data.caseInput);
        const recs = data.recommendations || data.caseInput.recommendations || [];
        setRecommendations(recs);
        setApprovalMessage('');
        setStatusMessage(`Analysis & Lawyer Matching complete! Code: ${data.caseInput.applicableCode}`);
      }
    } catch (err) {
      setStatusMessage('Error performing AI extraction.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.caseInput) {
        setCaseInput(data.caseInput);
        const recs = data.recommendations || data.caseInput.recommendations || [];
        setRecommendations(recs);
        setApprovalMessage('');
        setStatusMessage(`File "${data.fileName}" analyzed! Code: ${data.caseInput.applicableCode}`);
      }
    } catch (err) {
      setStatusMessage('Error uploading document.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(lawyerId) {
    const response = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseInput, lawyerId, notes })
    });
    const data = await response.json();
    setApprovalMessage(`Case assigned to ${data.approval.selectedLawyer} for "${data.approval.caseTitle}".`);
  }

  function handleStartOver() {
    setCaseInput(null);
    setRecommendations([]);
    setRawText('');
    setStatusMessage('');
    setApprovalMessage('');
  }

  return (
    <div className="min-vh-100 py-4 d-flex flex-column">
      {/* Header Banner */}
      <header className="hero-header py-4 mb-4 shadow-sm">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h1 className="h3 fw-bold text-white mb-1">
                ⚖️ Lawyer Tinder <span className="badge bg-primary fs-6 align-middle ms-2">AI Extraction & Matching</span>
              </h1>
              <p className="text-secondary mb-0 small">
                Upload a case document or paste facts – one click matching.
              </p>
            </div>
            {caseInput && caseInput.extractedBy && (
              <span className="extracted-pill d-inline-flex align-items-center gap-1">
                <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: '8px', height: '8px' }}></span>
                AI Mode: {caseInput.extractedBy === 'openrouter' ? 'OpenRouter API' : caseInput.extractedBy === 'ai' ? 'OpenAI GPT' : 'Heuristic Rules'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container flex-grow-1 d-flex flex-column">
        {statusMessage && !caseInput && (
           <div className="alert alert-info py-2 small bg-opacity-10 border-info text-info mb-4 text-center">{statusMessage}</div>
        )}
        
        {!caseInput ? (
          <div className="row justify-content-center align-items-center flex-grow-1">
            <div className="col-lg-8">
              <div className="app-card text-center p-5 shadow-lg border-0" style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)'}}>
                <h2 className="text-white mb-3 fw-bold">Ready to match a new case?</h2>
                <p className="text-slate-300 mb-4 fs-5">Paste your case details or upload a document.</p>
                
                <div className="mb-4">
                  <textarea
                    className="form-control form-control-custom text-start p-3 fs-5"
                    rows={4}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste case facts, termination notice, contract clause..."
                  />
                </div>
                
                <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
                  <button onClick={() => handleAnalyzeText()} disabled={isLoading || !rawText.trim()} className="btn btn-ai btn-lg px-5 shadow">
                    {isLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Analyzing...</>
                    ) : (
                      '✨ Analyze Text'
                    )}
                  </button>
                  
                  <div className="position-relative overflow-hidden btn btn-outline-light btn-lg px-4">
                    📁 Upload Document
                    <input type="file" className="position-absolute top-0 start-0 opacity-0 w-100 h-100" style={{cursor: 'pointer'}} accept=".pdf,.txt,.md,.csv" onChange={handleFileUpload} />
                  </div>
                </div>

                <div className="text-start mt-4 border-top border-secondary pt-4">
                  <label className="text-slate-400 small mb-3 d-block fw-bold text-uppercase tracking-wide">Or test with a 1-click Demo Case:</label>
                  <div className="d-flex flex-wrap gap-2">
                    {DEMO_CASES.map((demo, idx) => (
                      <button
                        key={idx}
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={() => handleAnalyzeText(demo.text)}
                        disabled={isLoading}
                      >
                        {demo.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4 fade-in">
            <div className="col-12 d-flex justify-content-between align-items-center mb-2">
              <h4 className="text-white mb-0">Analysis Results</h4>
              <button onClick={handleStartOver} className="btn btn-outline-secondary btn-sm rounded-pill px-3">
                ← Start New Case
              </button>
            </div>

            {/* AI Extracted Dashboard */}
            <div className="col-lg-4">
              <div className="app-card h-100 border-0 shadow">
                <div className="app-card-header bg-transparent border-bottom border-secondary pb-3 pt-4 px-4">
                  <h5 className="mb-0 fw-semibold text-white">🔍 Case Details</h5>
                </div>
                <div className="card-body p-4">
                  <div className="law-code-card mb-4 border-0 shadow-sm" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                    <div className="text-uppercase small text-blue-400 fw-bold mb-2">Applicable Legal Code</div>
                    <div className="law-code-badge fs-6 mb-0 w-100 justify-content-center">📜 {caseInput.applicableCode || 'No code detected'}</div>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-3">
                      ⏰ Key Deadlines
                      <span className="badge bg-danger rounded-pill">{caseInput.deadlines?.length || 0}</span>
                    </h6>
                    {caseInput.deadlines?.length ? (
                      <div className="d-flex flex-column gap-2">
                        {caseInput.deadlines.map((dl, idx) => (
                          <div key={`${dl.date}-${idx}`} className="deadline-card p-3 border-0 bg-dark bg-opacity-50">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold text-white fs-6">{dl.label || 'Deadline'}</span>
                              <span className="deadline-date-pill ms-2">📅 {dl.date}</span>
                            </div>
                            {dl.sourceText && <p className="text-secondary small mb-0 mt-2 fst-italic">"{dl.sourceText}"</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted small p-3 bg-dark bg-opacity-50 rounded border border-secondary border-opacity-25">
                        No specific deadline dates detected.
                      </div>
                    )}
                  </div>

                  <div className="row g-2 mt-auto">
                    <div className="col-6">
                      <div className="bg-dark bg-opacity-50 p-2 rounded">
                        <label className="form-label text-slate-400 small mb-0 d-block text-uppercase">Practice Area</label>
                        <span className="text-white fw-medium">{caseInput.practiceArea || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-dark bg-opacity-50 p-2 rounded">
                        <label className="form-label text-slate-400 small mb-0 d-block text-uppercase">Jurisdiction</label>
                        <span className="text-white fw-medium">{caseInput.jurisdiction || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attorney Recommendations */}
            <div className="col-lg-8">
              <div className="app-card h-100 border-0 shadow">
                <div className="app-card-header bg-transparent border-bottom border-secondary pb-3 pt-4 px-4 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-semibold text-white">👨‍⚖️ Matched Attorneys</h5>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    {recommendations.length === 0 ? (
                      <div className="col-12 text-center py-5 text-secondary">
                        No attorneys found for this case profile.
                      </div>
                    ) : (
                      recommendations.map((rec, index) => (
                        <div key={rec.id} className="col-md-6 mb-2">
                          <div className="lawyer-card p-4 h-100 d-flex flex-column justify-content-between border border-secondary border-opacity-50 shadow-sm position-relative overflow-hidden">
                            {index === 0 && <div className="position-absolute top-0 end-0 bg-success text-white px-3 py-1 small fw-bold" style={{borderBottomLeftRadius: '8px'}}>Top Match</div>}
                            <div>
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h5 className="fw-bold text-white mb-0">{rec.name}</h5>
                                <span className="badge bg-primary fs-6">Score: {rec.score}</span>
                              </div>
                              <p className="text-slate-300 mb-4">{rec.reason}</p>
                            </div>
                            <button onClick={() => handleApprove(rec.id)} className="btn btn-outline-success w-100 fw-bold">
                              Assign Case to {rec.name.split(' ')[0]}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {approvalMessage && (
                    <div className="alert alert-success mt-4 mb-0 d-flex align-items-center gap-2 border-0 shadow-sm">
                      <span className="fs-5">✅</span>
                      <div className="fw-medium">{approvalMessage}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

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

  const [rawText, setRawText] = useState(DEMO_CASES[0].text);
  const [caseInput, setCaseInput] = useState({
    title: 'Employment Termination Claim',
    practiceArea: 'Employment',
    caseFocus: 'Employment',
    jurisdiction: 'Germany',
    applicableCode: 'ArbZG / KSchG - Employment & Dismissal Protection Act',
    summary: 'An employee was terminated without notice and seeks legal action.',
    deadlines: [
      {
        date: '2026-08-25',
        label: 'Motion / Brief Due',
        sourceText: 'The brief submission deadline ends on 2026-08-25.'
      }
    ],
    primaryDeadlineDate: '2026-08-25',
    extractedBy: 'openrouter'
  });

  const [recommendations, setRecommendations] = useState([]);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [notes, setNotes] = useState('Urgent deadline - Please prioritize case intake.');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleAnalyzeText() {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, fileName: 'Input Legal Text' })
      });
      const data = await response.json();
      if (data.caseInput) {
        setCaseInput(data.caseInput);
        setStatusMessage(`Analysis complete! Applicable Legal Code: ${data.caseInput.applicableCode}`);
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
        setStatusMessage(`File "${data.fileName}" analyzed! Legal Code: ${data.caseInput.applicableCode}`);
      }
    } catch (err) {
      setStatusMessage('Error uploading document.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRecommend(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseInput)
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setApprovalMessage('');
    } catch (err) {
      setStatusMessage('Error fetching attorney recommendations.');
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

  return (
    <div className="min-vh-100 py-4">
      {/* Header Banner */}
      <header className="hero-header py-4 mb-4">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h1 className="h2 fw-bold text-white mb-1">
                ⚖️ Lawyer Tinder <span className="badge bg-primary fs-6 align-middle ms-2">AI Extraction</span>
              </h1>
              <p className="text-secondary mb-0">
                Automated AI extraction of applicable legal codes, deadlines & attorney routing.
              </p>
            </div>
            {caseInput.extractedBy && (
              <span className="extracted-pill d-inline-flex align-items-center gap-1">
                <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: '8px', height: '8px' }}></span>
                AI Mode: {caseInput.extractedBy === 'openrouter' ? 'OpenRouter API' : caseInput.extractedBy === 'ai' ? 'OpenAI GPT' : 'Heuristic Rules'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <div className="row g-4">
          {/* Left Column: Text & Document Input */}
          <div className="col-lg-6">
            <div className="app-card h-100">
              <div className="app-card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold text-white">📝 Input Legal Text or Upload Document</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label text-slate-300 fw-medium mb-0">Enter Case Description or Legal Text</label>
                    <div className="d-flex gap-2">
                      {DEMO_CASES.map((demo, idx) => (
                        <button
                          key={idx}
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setRawText(demo.text)}
                          title="Load demo text to test fallback"
                        >
                          {demo.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    className="form-control form-control-custom"
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste case facts, termination notice, contract clause, or legal complaint here..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-slate-300 fw-medium">Or Upload Document (.pdf, .txt, .md, .csv)</label>
                  <input type="file" className="form-control form-control-custom" accept=".pdf,.txt,.md,.csv" onChange={handleFileUpload} />
                </div>

                <div className="d-grid gap-2">
                  <button onClick={handleAnalyzeText} disabled={isLoading} className="btn btn-ai d-flex align-items-center justify-content-center gap-2">
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Extracting with AI...
                      </>
                    ) : (
                      <>✨ Extract with AI (Legal Code & Deadlines)</>
                    )}
                  </button>
                </div>

                {statusMessage && <div className="alert alert-info mt-3 mb-0 py-2 small bg-opacity-10 border-info text-info">{statusMessage}</div>}
              </div>
            </div>
          </div>

          {/* Right Column: AI Extracted Dashboard */}
          <div className="col-lg-6">
            <div className="app-card h-100">
              <div className="app-card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold text-white">🔍 AI Extraction Dashboard</h5>
              </div>
              <div className="card-body p-4">
                {/* Legal Code Highlight */}
                <div className="law-code-card mb-4">
                  <div className="text-uppercase small text-blue-400 fw-bold mb-1">Applicable Legal Code</div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="law-code-badge">📜 {caseInput.applicableCode || 'No legal code detected'}</span>
                  </div>
                  <p className="text-slate-300 small mb-0">
                    The AI identified this legal code based on statutory keywords, claims, and context in the document.
                  </p>
                </div>

                {/* Deadlines Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-3">
                    ⏰ Extracted Deadlines & Key Dates
                    <span className="badge bg-danger rounded-pill">{caseInput.deadlines?.length || 0}</span>
                  </h6>

                  {caseInput.deadlines?.length ? (
                    <div className="d-flex flex-column gap-2">
                      {caseInput.deadlines.map((dl, idx) => (
                        <div key={`${dl.date}-${idx}`} className="deadline-card p-3">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <span className="fw-semibold text-white">{dl.label || 'Deadline'}</span>
                            <span className="deadline-date-pill">📅 {dl.date}</span>
                          </div>
                          {dl.sourceText && <p className="text-secondary small mb-0 fst-italic">"{dl.sourceText}"</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small p-3 bg-dark bg-opacity-50 rounded border border-secondary border-opacity-25">
                      No specific deadline dates detected in the text.
                    </div>
                  )}
                </div>

                {/* Summary & Metadata */}
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-slate-300 small mb-1">Practice Area</label>
                    <input
                      type="text"
                      className="form-control form-control-custom form-control-sm"
                      value={caseInput.practiceArea || ''}
                      onChange={(e) => setCaseInput({ ...caseInput, practiceArea: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-slate-300 small mb-1">Jurisdiction</label>
                    <input
                      type="text"
                      className="form-control form-control-custom form-control-sm"
                      value={caseInput.jurisdiction || ''}
                      onChange={(e) => setCaseInput({ ...caseInput, jurisdiction: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Width: Attorney Recommendations */}
          <div className="col-12">
            <div className="app-card">
              <div className="app-card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold text-white">👨‍⚖️ Attorney Recommendations & Routing</h5>
                <button onClick={handleRecommend} className="btn btn-outline-primary btn-sm">
                  Match Attorneys
                </button>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  {recommendations.length === 0 ? (
                    <div className="col-12 text-center py-4 text-secondary">
                      Click "Match Attorneys" to view top candidates based on legal code ({caseInput.applicableCode}) and deadlines.
                    </div>
                  ) : (
                    recommendations.map((rec) => (
                      <div key={rec.id} className="col-md-4">
                        <div className="lawyer-card p-3 h-100 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold text-white mb-0">{rec.name}</h6>
                              <span className="badge bg-primary">Score: {rec.score}</span>
                            </div>
                            <p className="text-slate-300 small mb-3">{rec.reason}</p>
                          </div>
                          <button onClick={() => handleApprove(rec.id)} className="btn btn-outline-success btn-sm w-100 mt-2">
                            Assign Case
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {approvalMessage && (
                  <div className="alert alert-success mt-4 mb-0 d-flex align-items-center gap-2">
                    <span>✅</span>
                    <div>{approvalMessage}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

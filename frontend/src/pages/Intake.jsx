import { useState } from 'react';
import { 
  Scale, 
  Globe, 
  Sparkles, 
  FolderUp, 
  Search, 
  Cpu, 
  FileText, 
  Clock, 
  Calendar, 
  Download, 
  Brain, 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  Swords, 
  Gavel, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import { AdvertPlayerCard } from '../components/AdvertPlayer';
import { downloadIcsFile } from '../utils/icsExporter';

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

const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Default - Fast & Smart)' },
  { id: 'openai/gpt-4o', label: 'GPT-4o (High Accuracy & Complex Analysis)' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Superior Legal Reasoning)' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash (Ultra Fast Speed)' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (Advanced General AI)' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (Deep Legal Chain-of-Thought)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (Open Weights Powerhouse)' },
  { id: 'custom', label: 'Custom OpenRouter Model ID...' }
];

function Intake() {
  const DEMO_CASES = [
    {
      label: 'Employment',
      text: 'Client John Doe was terminated without notice. Under the Employment Protection Act and Working Hours Act, a legal complaint must be filed. The brief submission deadline ends on 2026-08-25.'
    },
    {
      label: 'Medical Malpractice',
      text: 'Patient Jane Smith suffered severe injuries due to a surgical error at the Munich Hospital. We are pursuing a medical malpractice claim under the Civil Code. The statute of limitations for the claim expires on 2027-01-15.'
    },
    {
      label: 'Commercial',
      text: 'Breach of contract regarding a commercial goods delivery for client Acme Corp. The supplier failed to deliver on time. We need to file a lawsuit under the Commercial Code. The hearing date is set for 2026-10-10.'
    },
    {
      label: 'Criminal',
      text: 'Client Michael Johnson is accused of theft and fraud under the Criminal Code. The police have issued an arrest warrant. We need to prepare for the court hearing scheduled for 2026-09-12.'
    },
    {
      label: 'Data Protection',
      text: 'A company leaked user data of client Alice Brown. We are filing a claim based on the GDPR. The data protection authority must be notified by 2026-09-01.'
    }
  ];

  const [rawText, setRawText] = useState('');
  const [caseInput, setCaseInput] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [notes, setNotes] = useState('Urgent deadline - Please prioritize case intake.');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
  const [customModel, setCustomModel] = useState('');

  const activeModel = selectedModel === 'custom' ? (customModel.trim() || 'openai/gpt-4o-mini') : selectedModel;

  async function handleAnalyzeText(text = rawText) {
    if (!text.trim()) return;
    setIsLoading(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName: 'Input Legal Text', model: activeModel })
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
    formData.append('model', activeModel);

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
    <div className="h-100 py-4 d-flex flex-column">
      {/* Header Banner */}
      <header className="hero-header py-4 mb-4 shadow-sm">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h1 className="h3 fw-bold mb-1 d-flex align-items-center gap-2">
                <Scale size={24} className="text-primary" /> Lawyer Tinder <span className="badge bg-primary fs-6 align-middle ms-2">AI Extraction & Matching</span>
              </h1>
              <p className="text-secondary mb-0 small">
                Upload a case document or paste facts – one click matching with multi-model AI.
              </p>
            </div>
            {caseInput && caseInput.extractedBy && (
              <span className="extracted-pill d-inline-flex align-items-center gap-1">
                <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: '8px', height: '8px' }}></span>
                AI Mode: {caseInput.extractedBy === 'openrouter' ? `OpenRouter (${caseInput.usedModel || activeModel})` : caseInput.extractedBy === 'ai' ? 'OpenAI GPT' : 'Heuristic Rules'}
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
              <div className="app-card text-center p-5 shadow-lg border-0">
                <h2 className="mb-3 fw-bold">Ready to match a new case?</h2>
                <p className="text-muted mb-4 fs-5">Select your OpenRouter AI model, paste details, or upload a document.</p>
                
                {/* OpenRouter Model Selector */}
                <div className="mb-4 text-start p-3 rounded-3 border shadow-sm app-card">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <label className="form-label mb-0 fw-semibold d-flex align-items-center gap-2 small">
                      <Globe size={16} className="text-primary" /> Choose OpenRouter Model:
                    </label>
                    <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 small">
                      Active: {activeModel}
                    </span>
                  </div>
                  <select
                    className="form-select form-select-custom mb-2"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {OPENROUTER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  {selectedModel === 'custom' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="e.g. mistralai/mistral-large-2411 or qwen/qwen-2.5-72b-instruct"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                      />
                      <span className="text-secondary small ms-1">
                        Enter any valid model ID supported on OpenRouter.ai
                      </span>
                    </div>
                  )}
                </div>

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
                  <button onClick={() => handleAnalyzeText()} disabled={isLoading || !rawText.trim()} className="btn btn-ai btn-lg px-5 shadow d-inline-flex align-items-center gap-2">
                    {isLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Analyzing...</>
                    ) : (
                      <><Sparkles size={18} /> Analyze Text</>
                    )}
                  </button>
                  
                  <div className="position-relative overflow-hidden btn btn-outline-secondary btn-lg px-4 d-inline-flex align-items-center gap-2">
                    <FolderUp size={18} /> Upload Document
                    <input type="file" className="position-absolute top-0 start-0 opacity-0 w-100 h-100" style={{cursor: 'pointer'}} accept=".pdf,.txt,.md,.csv" onChange={handleFileUpload} />
                  </div>
                </div>

                <div className="text-start mt-4 border-top pt-4">
                  <label className="text-muted small mb-3 d-block fw-bold text-uppercase tracking-wide">Or test with a 1-click Demo Case:</label>
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
              <h4 className="mb-0 fw-bold">Analysis Results</h4>
              <button onClick={handleStartOver} className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1">
                <ArrowLeft size={14} /> Start New Case
              </button>
            </div>

            {/* AI Extracted Dashboard */}
            <div className="col-lg-4">
              <div className="app-card h-100 shadow">
                <div className="app-card-header pb-3 pt-4 px-4 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-semibold d-inline-flex align-items-center gap-2">
                    <Search size={18} className="text-primary" /> Case Details
                  </h5>
                  <span className="badge bg-secondary bg-opacity-20 text-body border small d-inline-flex align-items-center gap-1" title="OpenRouter AI Model Used">
                    <Cpu size={13} /> {caseInput.usedModel || activeModel}
                  </span>
                </div>
                <div className="card-body p-4">
                  <div className="law-code-card mb-4 shadow-sm">
                    <div className="text-uppercase small fw-bold mb-2 text-primary">Applicable Legal Code</div>
                    <div className="law-code-badge fs-6 mb-0 w-100 justify-content-center">
                      <FileText size={16} /> {caseInput.applicableCode || 'No code detected'}
                    </div>
                  </div>

                  {caseInput.summary && (
                    <div className="mb-4">
                      <h6 className="fw-bold d-flex align-items-center gap-2 mb-2">
                        <FileText size={16} className="text-primary" /> Case Summary
                      </h6>
                      <div className="p-3 app-card rounded small">
                        {caseInput.summary}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold d-flex align-items-center gap-2 mb-0">
                        <Clock size={16} className="text-danger" /> Key Deadlines
                        <span className="badge bg-danger rounded-pill">{caseInput.deadlines?.length || 0}</span>
                      </h6>
                      {caseInput.deadlines?.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1 py-1 px-2 text-nowrap fw-semibold"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => downloadIcsFile(caseInput.deadlines, {
                            caseTitle: caseInput.title || 'Case Intake',
                            clientName: caseInput.clientName,
                            applicableCode: caseInput.applicableCode
                          }, `${caseInput.title || 'case'}_deadlines.ics`)}
                        >
                          <Calendar size={13} /> Export All (.ics)
                        </button>
                      )}
                    </div>
                    {caseInput.deadlines?.length ? (
                      <div className="d-flex flex-column gap-2">
                        {caseInput.deadlines.map((dl, idx) => (
                          <div key={`${dl.date}-${idx}`} className="deadline-card p-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold fs-6">{dl.label || 'Deadline'}</span>
                              <div className="d-flex align-items-center gap-2">
                                <span className="deadline-date-pill d-inline-flex align-items-center gap-1">
                                  <Calendar size={13} /> {formatDate(dl.date)}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-info py-0 px-2 fw-medium d-inline-flex align-items-center gap-1"
                                  style={{ fontSize: '0.75rem', borderRadius: '12px' }}
                                  title="Download .ics for this deadline"
                                  onClick={() => downloadIcsFile([dl], {
                                    caseTitle: caseInput.title || 'Case Intake',
                                    clientName: caseInput.clientName,
                                    applicableCode: caseInput.applicableCode
                                  }, `${dl.label || 'deadline'}.ics`)}
                                >
                                  <Download size={11} /> .ics
                                </button>
                              </div>
                            </div>
                            {dl.sourceText && <p className="text-muted small mb-0 mt-2 fst-italic">"{dl.sourceText}"</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted small p-3 app-card rounded">
                        No specific deadline dates detected.
                      </div>
                    )}
                  </div>

                  <div className="row g-2 mt-auto">
                    <div className="col-6">
                      <div className="app-card p-2 rounded">
                        <label className="form-label text-muted small mb-0 d-block text-uppercase">Practice Area</label>
                        <span className="fw-medium">{caseInput.practiceArea || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="app-card p-2 rounded">
                        <label className="form-label text-muted small mb-0 d-block text-uppercase">Jurisdiction</label>
                        <span className="fw-medium">{caseInput.jurisdiction || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attorney Recommendations */}
            <div className="col-lg-8">
              <div className="app-card h-100 shadow">
                <div className="app-card-header pb-3 pt-4 px-4 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-semibold d-inline-flex align-items-center gap-2">
                    <Gavel size={20} className="text-primary" /> Matched Attorneys
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    {recommendations.length === 0 ? (
                      <div className="col-12 text-center py-5 text-muted">
                        No attorneys found for this case profile.
                      </div>
                    ) : (
                      recommendations.map((rec, index) => (
                        <div key={rec.id} className="col-md-6 mb-2">
                          <div className="lawyer-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm position-relative overflow-hidden">
                            {index === 0 && <div className="position-absolute top-0 end-0 bg-success text-white px-3 py-1 small fw-bold" style={{borderBottomLeftRadius: '8px'}}>Top Match</div>}
                            <div>
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h5 className="fw-bold mb-0">{rec.name}</h5>
                                <span className="badge bg-primary fs-6">Score: {rec.score}</span>
                              </div>
                              <p className="text-muted mb-4">{rec.reason}</p>
                            </div>
                            <button onClick={() => handleApprove(rec.id)} className="btn btn-outline-success w-100 fw-bold">
                              Assign Case to {rec.name}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {approvalMessage && (
                    <div className="alert alert-success mt-4 mb-0 d-flex align-items-center gap-2 border-0 shadow-sm">
                      <CheckCircle2 size={20} className="text-success" />
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

export default Intake;


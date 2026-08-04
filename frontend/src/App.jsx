import { useState } from 'react';

function App() {
  const [caseInput, setCaseInput] = useState({
    title: 'Employment discrimination claim',
    practiceArea: 'Employment',
    jurisdiction: 'New York',
    summary: 'A former employee alleges wrongful termination and retaliation.'
  });
  const [recommendations, setRecommendations] = useState([]);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [notes, setNotes] = useState('Needs a fast response');
  const [uploadMessage, setUploadMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseInput)
    });
    const data = await response.json();
    setRecommendations(data.recommendations);
    setApprovalMessage('');
  }

  async function handleApprove(lawyerId) {
    const response = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseInput, lawyerId, notes })
    });
    const data = await response.json();
    setApprovalMessage(`${data.approval.selectedLawyer} approved for ${data.approval.caseTitle}`);
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    setCaseInput(data.caseInput);
    setUploadMessage(`Loaded ${data.fileName}`);
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 fw-bold mb-2">Lawyer Tinder</h1>
              <p className="text-muted mb-4">Upload a case document, review the extracted summary, and route it to the most suitable lawyer.</p>

              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Upload case document</label>
                  <input type="file" className="form-control" accept=".txt,.md,.csv" onChange={handleUpload} />
                  {uploadMessage ? <div className="form-text text-success">{uploadMessage}</div> : null}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Case title</label>
                  <input className="form-control" value={caseInput.title} onChange={(e) => setCaseInput({ ...caseInput, title: e.target.value })} placeholder="Case title" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Practice area</label>
                  <input className="form-control" value={caseInput.practiceArea} onChange={(e) => setCaseInput({ ...caseInput, practiceArea: e.target.value })} placeholder="Practice area" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Jurisdiction</label>
                  <input className="form-control" value={caseInput.jurisdiction} onChange={(e) => setCaseInput({ ...caseInput, jurisdiction: e.target.value })} placeholder="Jurisdiction" />
                </div>
                <div className="col-12">
                  <label className="form-label">Case summary</label>
                  <textarea className="form-control" value={caseInput.summary} onChange={(e) => setCaseInput({ ...caseInput, summary: e.target.value })} placeholder="Case summary" rows={5} />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary">Recommend lawyer</button>
                </div>
              </form>

              <h2 className="h5 mt-4">Recommendations</h2>
              {recommendations.length === 0 ? (
                <p className="text-muted">No recommendations yet.</p>
              ) : (
                <div className="list-group mt-3">
                  {recommendations.map((item) => (
                    <div key={item.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <div className="fw-semibold">{item.name}</div>
                          <div className="text-muted small">Score: {item.score}</div>
                          <div className="mt-2">{item.reason}</div>
                        </div>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => handleApprove(item.id)} type="button">Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <label className="form-label">Approval notes</label>
                <textarea className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Approval notes" rows={3} />
                {approvalMessage ? <div className="alert alert-success mt-3 mb-0">{approvalMessage}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

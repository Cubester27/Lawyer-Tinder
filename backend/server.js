import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { approveRecommendation, rankLawyersForCase } from './src/services/caseMatcher.js';
import { extractLegalInfoWithAI } from './src/services/aiExtractor.js';
import { loadApprovals, updateApprovalStatus, loadLawyerProfiles, updateApprovalDraft } from './src/services/lawyerStore.js';
import { generateEngagementLetter } from './src/services/documentGenerator.js';
import { generateLegalDraft } from './src/services/draftGenerator.js';
import { generateIcsContent } from './src/services/icsGenerator.js';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/extract', async (req, res) => {
  const { text, fileName, model } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text required for extraction' });
  }

  const caseInput = await extractLegalInfoWithAI(text, fileName || 'Legal Text', model);
  res.json({ caseInput, recommendations: caseInput.recommendations || [] });
});

app.post('/api/recommend', async (req, res) => {
  const { caseInput, model } = req.body;
  const recommendations = await rankLawyersForCase(caseInput, model);
  res.json({ recommendations });
});

app.post('/api/approve', (req, res) => {
  const { caseInput, lawyerId, notes } = req.body;
  const approval = approveRecommendation(caseInput, lawyerId, notes);
  res.json({ approval });
});

app.get('/api/cases', (req, res) => {
  const cases = loadApprovals();
  res.json({ cases });
});

app.get('/api/lawyers', (req, res) => {
  const lawyers = loadLawyerProfiles();
  res.json({ lawyers });
});

app.patch('/api/cases/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  const updated = updateApprovalStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Case not found' });
  }
  
  res.json({ case: updated });
});

app.get('/api/cases/:id/engagement-letter', async (req, res) => {
  const cases = loadApprovals();
  const caseApproval = cases.find(c => c.id === req.params.id);
  if (!caseApproval) return res.status(404).json({ error: 'Case not found' });
  try {
    const pdfBuffer = await generateEngagementLetter(caseApproval);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Engagement_Letter_${caseApproval.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/api/cases/:id/ics', (req, res) => {
  const cases = loadApprovals();
  const caseApproval = cases.find(c => c.id === req.params.id);
  if (!caseApproval) return res.status(404).json({ error: 'Case not found' });

  const deadlines = caseApproval.caseDetails?.deadlines || [];
  if (deadlines.length === 0 && caseApproval.caseDetails?.primaryDeadlineDate) {
    deadlines.push({
      date: caseApproval.caseDetails.primaryDeadlineDate,
      label: 'Primary Case Deadline'
    });
  }

  const icsString = generateIcsContent(deadlines, {
    caseTitle: caseApproval.caseTitle,
    clientName: caseApproval.caseDetails?.clientName,
    applicableCode: caseApproval.caseDetails?.applicableCode,
    id: caseApproval.id
  });

  const filename = `Deadlines_${caseApproval.id}.ics`;
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(icsString);
});

app.post('/api/cases/:id/draft', async (req, res) => {
  const cases = loadApprovals();
  const caseApproval = cases.find(c => c.id === req.params.id);
  if (!caseApproval) return res.status(404).json({ error: 'Case not found' });
  
  if (caseApproval.draft && !req.body.forceRegenerate) {
    return res.json({ draft: caseApproval.draft });
  }
  
  try {
    const draftText = await generateLegalDraft({
      title: caseApproval.caseTitle,
      ...caseApproval.caseDetails
    });
    const updated = updateApprovalDraft(caseApproval.id, draftText);
    res.json({ draft: updated.draft });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate draft' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let text = '';
  const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const parser = new PDFParse({ data: file.buffer });
      const pdfData = await parser.getText();
      text = pdfData.text || '';
    } catch (error) {
      text = file.buffer.toString('utf8').replace(/[^\x20-\x7E\s]/g, ' ').trim();
    }
  } else {
    text = file.buffer.toString('utf8').trim();
  }

  const selectedModel = req.body?.model;
  const caseInput = await extractLegalInfoWithAI(text, file.originalname, selectedModel);

  res.json({
    caseInput,
    recommendations: caseInput.recommendations || [],
    fileName: file.originalname,
    contentType: file.mimetype
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    res.json({ success: true, token: 'mock-jwt-token', user: { username: 'admin' } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { approveRecommendation, rankLawyersForCase } from './src/services/caseMatcher.js';
import { extractLegalInfoWithAI } from './src/services/aiExtractor.js';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/extract', async (req, res) => {
  const { text, fileName } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text required for extraction' });
  }

  const caseInput = await extractLegalInfoWithAI(text, fileName || 'Legal Text');
  res.json({ caseInput, recommendations: caseInput.recommendations || [] });
});

app.post('/api/recommend', async (req, res) => {
  const caseInput = req.body;
  const recommendations = await rankLawyersForCase(caseInput);
  res.json({ recommendations });
});

app.post('/api/approve', (req, res) => {
  const { caseInput, lawyerId, notes } = req.body;
  const approval = approveRecommendation(caseInput, lawyerId, notes);
  res.json({ approval });
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

  const caseInput = await extractLegalInfoWithAI(text, file.originalname);

  res.json({
    caseInput,
    recommendations: caseInput.recommendations || [],
    fileName: file.originalname,
    contentType: file.mimetype
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { approveRecommendation, rankLawyersForCase } from './src/services/caseMatcher.js';
import { extractCaseSummary } from './src/services/documentParser.js';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const text = file.buffer.toString('utf8').trim();
  const summary = extractCaseSummary(text, file.originalname);

  res.json({
    caseInput: summary,
    fileName: file.originalname,
    contentType: file.mimetype
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

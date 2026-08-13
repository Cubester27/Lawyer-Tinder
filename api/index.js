import app from '../backend/server.js';

export default async function handler(req, res) {
  try {
    return await app(req, res);
  } catch (err) {
    console.error('Vercel Serverless Function error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error', stack: err.stack });
  }
}

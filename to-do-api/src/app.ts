import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

export default app; 
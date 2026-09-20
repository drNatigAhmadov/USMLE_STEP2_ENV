import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

dotenv.config();

const dataDir = process.env.VERCEL ? '/tmp/data' : join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ 
    name: 'USMLE Step 2 CK Practice API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      questions: '/api/questions/*',
      reviews: '/api/reviews/*',
      progress: '/api/progress/*',
      exams: '/api/exams/*'
    }
  });
});

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
import { Router, Request, Response, NextFunction } from 'express';
import { fetchMedQAQuestions, categorizeQuestion, calculateDifficulty } from '../services/medqa';
import { questionService, reviewService, progressService, examService } from '../services/database';
import { sm2Algorithm, getQualityFromUserResponse, getReviewStats } from '../services/spaced-repetition';

const router = Router();

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  (req as any).userId = userId;
  next();
};

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/questions/sync', async (req: Request, res: Response) => {
  try {
    const questions = await fetchMedQAQuestions(500);
    let synced = 0;
    
    for (const q of questions) {
      const { theme, subtheme } = categorizeQuestion(q);
      const difficulty = calculateDifficulty(q);
      
      const exists = await questionService.getById(q.question.slice(0, 36));
      if (!exists) {
        await questionService.create({
          question_text: q.question,
          options: q.options,
          correct_answer: q.answer,
          explanation: q.explanation,
          theme,
          subtheme,
          difficulty,
          source: 'medqa'
        });
        synced++;
      }
    }
    
    res.json({ synced, total: questions.length });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync questions' });
  }
});

router.get('/questions/themes', async (req: Request, res: Response) => {
  const themes = await questionService.getAllThemes();
  res.json({ themes });
});

router.get('/questions/theme/:theme', async (req: Request, res: Response) => {
  const { theme } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const questions = await questionService.getByTheme(theme, limit, offset);
  res.json({ questions });
});

router.get('/questions/random/:theme', async (req: Request, res: Response) => {
  const { theme } = req.params;
  const count = parseInt(req.query.count as string) || 10;
  const questions = await questionService.getRandomByTheme(theme, count);
  res.json({ questions });
});

router.get('/questions/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.length < 2) {
    return res.json({ questions: [] });
  }
  const questions = await questionService.search(query);
  res.json({ questions });
});

router.get('/questions/due', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const limit = parseInt(req.query.limit as string) || 20;
  const questions = await questionService.getForSpacedRepetition(userId, limit);
  res.json({ questions });
});

router.post('/reviews', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { question_id, quality } = req.body;
  
  if (!question_id || quality === undefined) {
    return res.status(400).json({ error: 'question_id and quality required' });
  }
  
  const review = await reviewService.getOrCreate(userId, question_id);
  const result = sm2Algorithm(review, quality);
  
  review.ease_factor = result.ease_factor;
  review.interval = result.interval;
  review.repetitions = result.repetitions;
  review.next_review = result.next_review.toISOString();
  review.last_reviewed = new Date().toISOString();
  
  await reviewService.update(review);
  
  const question = await questionService.getById(question_id);
  if (question) {
    await progressService.update(userId, question.theme, quality >= 3);
  }
  
  res.json({ review, next_review: result.next_review });
});

router.post('/reviews/answer', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { question_id, user_answer, confidence } = req.body;
  
  const question = await questionService.getById(question_id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  const isCorrect = user_answer === question.correct_answer;
  const quality = getQualityFromUserResponse(isCorrect, confidence || 'medium');
  
  const review = await reviewService.getOrCreate(userId, question_id);
  const result = sm2Algorithm(review, quality);
  
  review.ease_factor = result.ease_factor;
  review.interval = result.interval;
  review.repetitions = result.repetitions;
  review.next_review = result.next_review.toISOString();
  review.last_reviewed = new Date().toISOString();
  
  await reviewService.update(review);
  await progressService.update(userId, question.theme, isCorrect);
  
  res.json({
    correct: isCorrect,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    next_review: result.next_review,
    ease_factor: result.ease_factor
  });
});

router.get('/progress', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const progress = await progressService.getByUser(userId);
  const stats = await progressService.getOverallStats(userId);
  res.json({ progress, stats });
});

router.get('/progress/theme/:theme', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { theme } = req.params;
  const progress = await progressService.getByUser(userId);
  const themeProgress = progress.find(p => p.theme === theme);
  res.json({ progress: themeProgress || null });
});

router.post('/exams/step2', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { exam, questions } = await examService.generateStep2Exam(userId);
  res.json({ exam, questions });
});

router.post('/exams/:examId/submit', authMiddleware, async (req: Request, res: Response) => {
  const { examId } = req.params;
  const { answers, time_taken } = req.body;
  
  const exam = await examService.submit(examId, answers, time_taken);
  const details = await examService.getExamDetails(examId);
  
  res.json({ exam, details });
});

router.get('/exams', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const exams = await examService.getByUser(userId);
  res.json({ exams });
});

router.get('/exams/:examId', authMiddleware, async (req: Request, res: Response) => {
  const { examId } = req.params;
  const details = await examService.getExamDetails(examId);
  if (!details) {
    return res.status(404).json({ error: 'Exam not found' });
  }
  res.json(details);
});

router.get('/stats/reviews', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const reviews = await reviewService.getByUser(userId);
  const dueCount = await reviewService.getDueCount(userId);
  const stats = getReviewStats(reviews);
  res.json({ ...stats, due: dueCount });
});

export default router;
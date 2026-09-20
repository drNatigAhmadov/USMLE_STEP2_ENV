"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medqa_1 = require("../services/medqa");
const database_1 = require("../services/database");
const spaced_repetition_1 = require("../services/spaced-repetition");
const router = (0, express_1.Router)();
const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }
    req.userId = userId;
    next();
};
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.post('/questions/sync', async (req, res) => {
    try {
        const questions = await (0, medqa_1.fetchMedQAQuestions)(500);
        let synced = 0;
        for (const q of questions) {
            const { theme, subtheme } = (0, medqa_1.categorizeQuestion)(q);
            const difficulty = (0, medqa_1.calculateDifficulty)(q);
            const exists = await database_1.questionService.getById(q.question.slice(0, 36));
            if (!exists) {
                await database_1.questionService.create({
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
    }
    catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to sync questions' });
    }
});
router.get('/questions/themes', async (req, res) => {
    const themes = await database_1.questionService.getAllThemes();
    res.json({ themes });
});
router.get('/questions/theme/:theme', async (req, res) => {
    const { theme } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const questions = await database_1.questionService.getByTheme(theme, limit, offset);
    res.json({ questions });
});
router.get('/questions/random/:theme', async (req, res) => {
    const { theme } = req.params;
    const count = parseInt(req.query.count) || 10;
    const questions = await database_1.questionService.getRandomByTheme(theme, count);
    res.json({ questions });
});
router.get('/questions/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
        return res.json({ questions: [] });
    }
    const questions = await database_1.questionService.search(query);
    res.json({ questions });
});
router.get('/questions/due', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    const questions = await database_1.questionService.getForSpacedRepetition(userId, limit);
    res.json({ questions });
});
router.post('/reviews', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { question_id, quality } = req.body;
    if (!question_id || quality === undefined) {
        return res.status(400).json({ error: 'question_id and quality required' });
    }
    const review = await database_1.reviewService.getOrCreate(userId, question_id);
    const result = (0, spaced_repetition_1.sm2Algorithm)(review, quality);
    review.ease_factor = result.ease_factor;
    review.interval = result.interval;
    review.repetitions = result.repetitions;
    review.next_review = result.next_review.toISOString();
    review.last_reviewed = new Date().toISOString();
    await database_1.reviewService.update(review);
    const question = await database_1.questionService.getById(question_id);
    if (question) {
        await database_1.progressService.update(userId, question.theme, quality >= 3);
    }
    res.json({ review, next_review: result.next_review });
});
router.post('/reviews/answer', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { question_id, user_answer, confidence } = req.body;
    const question = await database_1.questionService.getById(question_id);
    if (!question) {
        return res.status(404).json({ error: 'Question not found' });
    }
    const isCorrect = user_answer === question.correct_answer;
    const quality = (0, spaced_repetition_1.getQualityFromUserResponse)(isCorrect, confidence || 'medium');
    const review = await database_1.reviewService.getOrCreate(userId, question_id);
    const result = (0, spaced_repetition_1.sm2Algorithm)(review, quality);
    review.ease_factor = result.ease_factor;
    review.interval = result.interval;
    review.repetitions = result.repetitions;
    review.next_review = result.next_review.toISOString();
    review.last_reviewed = new Date().toISOString();
    await database_1.reviewService.update(review);
    await database_1.progressService.update(userId, question.theme, isCorrect);
    res.json({
        correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        next_review: result.next_review,
        ease_factor: result.ease_factor
    });
});
router.get('/progress', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const progress = await database_1.progressService.getByUser(userId);
    const stats = await database_1.progressService.getOverallStats(userId);
    res.json({ progress, stats });
});
router.get('/progress/theme/:theme', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { theme } = req.params;
    const progress = await database_1.progressService.getByUser(userId);
    const themeProgress = progress.find(p => p.theme === theme);
    res.json({ progress: themeProgress || null });
});
router.post('/exams/step2', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { exam, questions } = await database_1.examService.generateStep2Exam(userId);
    res.json({ exam, questions });
});
router.post('/exams/:examId/submit', authMiddleware, async (req, res) => {
    const { examId } = req.params;
    const { answers, time_taken } = req.body;
    const exam = await database_1.examService.submit(examId, answers, time_taken);
    const details = await database_1.examService.getExamDetails(examId);
    res.json({ exam, details });
});
router.get('/exams', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const exams = await database_1.examService.getByUser(userId);
    res.json({ exams });
});
router.get('/exams/:examId', authMiddleware, async (req, res) => {
    const { examId } = req.params;
    const details = await database_1.examService.getExamDetails(examId);
    if (!details) {
        return res.status(404).json({ error: 'Exam not found' });
    }
    res.json(details);
});
router.get('/stats/reviews', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const reviews = await database_1.reviewService.getByUser(userId);
    const dueCount = await database_1.reviewService.getDueCount(userId);
    const stats = (0, spaced_repetition_1.getReviewStats)(reviews);
    res.json({ ...stats, due: dueCount });
});
exports.default = router;
//# sourceMappingURL=api.js.map
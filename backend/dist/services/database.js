"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examService = exports.progressService = exports.reviewService = exports.questionService = void 0;
const init_1 = require("../db/init");
function genId() {
    return crypto.randomUUID();
}
exports.questionService = {
    async create(question) {
        const id = genId();
        const newQuestion = { ...question, id, created_at: new Date().toISOString() };
        init_1.db.insert('questions', newQuestion);
        return newQuestion;
    },
    async getById(id) {
        const q = init_1.db.get('questions', id);
        if (!q)
            return null;
        return { ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options };
    },
    async getByTheme(theme, limit = 20, offset = 0) {
        const questions = init_1.db.query('questions', {
            where: (q) => q.theme === theme,
            limit,
            offset,
        });
        return questions.map(q => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }));
    },
    async getRandomByTheme(theme, count) {
        const questions = init_1.db.query('questions', {
            where: (q) => q.theme === theme,
        });
        const shuffled = questions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(q => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }));
    },
    async getAllThemes() {
        const questions = init_1.db.getAll('questions');
        const themes = [...new Set(questions.map(q => q.theme))];
        return themes.sort();
    },
    async getForSpacedRepetition(userId, limit = 20) {
        const now = new Date().toISOString();
        const reviews = init_1.db.query('question_reviews', {
            where: (r) => r.user_id === userId && r.next_review <= now,
            orderBy: (a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime(),
            limit,
        });
        const questionIds = reviews.map(r => r.question_id);
        const questions = questionIds.map(id => init_1.db.get('questions', id)).filter(Boolean);
        return questions.map(q => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }));
    },
    async search(query, limit = 20) {
        const lowerQuery = query.toLowerCase();
        const questions = init_1.db.query('questions', {
            where: (q) => q.question_text.toLowerCase().includes(lowerQuery) || (q.explanation?.toLowerCase().includes(lowerQuery)),
            limit,
        });
        return questions.map(q => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }));
    }
};
exports.reviewService = {
    async getOrCreate(userId, questionId) {
        let review = init_1.db.find('question_reviews', r => r.user_id === userId && r.question_id === questionId);
        if (!review) {
            const id = genId();
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + 1);
            review = {
                id,
                user_id: userId,
                question_id: questionId,
                ease_factor: 2.5,
                interval: 0,
                repetitions: 0,
                next_review: nextReview.toISOString()
            };
            init_1.db.insert('question_reviews', review);
        }
        return review;
    },
    async update(review) {
        init_1.db.update('question_reviews', review.id, review);
    },
    async getByUser(userId) {
        return init_1.db.query('question_reviews', { where: (r) => r.user_id === userId });
    },
    async getDueCount(userId) {
        const now = new Date().toISOString();
        return init_1.db.query('question_reviews', {
            where: (r) => r.user_id === userId && r.next_review <= now
        }).length;
    }
};
exports.progressService = {
    async update(userId, theme, isCorrect) {
        let progress = init_1.db.find('user_progress', p => p.user_id === userId && p.theme === theme);
        if (!progress) {
            const id = genId();
            progress = { id, user_id: userId, theme, questions_attempted: 0, questions_correct: 0, average_score: 0 };
            init_1.db.insert('user_progress', progress);
        }
        progress.questions_attempted += 1;
        if (isCorrect)
            progress.questions_correct += 1;
        progress.average_score = progress.questions_correct / progress.questions_attempted;
        progress.last_practiced = new Date().toISOString();
        init_1.db.update('user_progress', progress.id, progress);
        return progress;
    },
    async getByUser(userId) {
        return init_1.db.query('user_progress', {
            where: (p) => p.user_id === userId,
            orderBy: (a, b) => a.average_score - b.average_score,
        });
    },
    async getOverallStats(userId) {
        const progress = await exports.progressService.getByUser(userId);
        const total_attempted = progress.reduce((sum, p) => sum + p.questions_attempted, 0);
        const total_correct = progress.reduce((sum, p) => sum + p.questions_correct, 0);
        return {
            total_attempted,
            total_correct,
            overall_score: total_attempted ? total_correct / total_attempted : 0,
            themes_practiced: progress.length
        };
    }
};
exports.examService = {
    async create(userId, questionIds) {
        const examId = genId();
        const exam = {
            id: examId,
            user_id: userId,
            total_questions: questionIds.length,
            correct_answers: 0,
            time_taken: 0,
            completed_at: new Date().toISOString()
        };
        init_1.db.insert('practice_exams', exam);
        const examQuestions = questionIds.map(qId => {
            const id = genId();
            const eq = { id, exam_id: examId, question_id: qId, time_spent: 0 };
            init_1.db.insert('practice_exam_questions', eq);
            return eq;
        });
        return { exam, questions: examQuestions };
    },
    async submit(examId, answers, timeTaken) {
        const examQuestions = init_1.db.query('practice_exam_questions', { where: (q) => q.exam_id === examId });
        let correct = 0;
        for (const eq of examQuestions) {
            const question = await exports.questionService.getById(eq.question_id);
            if (question && answers[eq.question_id] === question.correct_answer) {
                correct++;
                init_1.db.update('practice_exam_questions', eq.id, { user_answer: answers[eq.question_id], is_correct: true });
            }
            else {
                init_1.db.update('practice_exam_questions', eq.id, { user_answer: answers[eq.question_id] || '', is_correct: false });
            }
        }
        const score = (correct / examQuestions.length) * 100;
        init_1.db.update('practice_exams', examId, { correct_answers: correct, score, time_taken: timeTaken });
        const updatedExam = init_1.db.get('practice_exams', examId);
        return { ...updatedExam, score, correct_answers: correct, time_taken: timeTaken };
    },
    async getById(id) {
        return init_1.db.get('practice_exams', id);
    },
    async getByUser(userId) {
        return init_1.db.query('practice_exams', {
            where: (e) => e.user_id === userId,
            orderBy: (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
        });
    },
    async getExamDetails(examId) {
        const exam = await exports.examService.getById(examId);
        if (!exam)
            return null;
        const examQuestions = init_1.db.query('practice_exam_questions', { where: (q) => q.exam_id === examId });
        const questions = await Promise.all(examQuestions.map(async (eq) => {
            const question = await exports.questionService.getById(eq.question_id);
            return { ...eq, question: question };
        }));
        return { exam, questions };
    },
    async generateStep2Exam(userId) {
        const themes = await exports.questionService.getAllThemes();
        const questionIds = [];
        const questionsPerTheme = Math.ceil(40 / themes.length);
        for (const theme of themes) {
            const qs = await exports.questionService.getRandomByTheme(theme, questionsPerTheme);
            questionIds.push(...qs.map(q => q.id));
        }
        while (questionIds.length < 40) {
            const extra = await exports.questionService.getRandomByTheme(themes[0], 40 - questionIds.length);
            questionIds.push(...extra.map(q => q.id));
        }
        return exports.examService.create(userId, questionIds.slice(0, 40));
    }
};
//# sourceMappingURL=database.js.map
import { db } from '../db/init';
import { Question, QuestionReview, UserProgress, PracticeExam, PracticeExamQuestion } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const questionService = {
  async create(question: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
    const id = genId();
    const newQuestion = { ...question, id, created_at: new Date().toISOString() };
    db.insert('questions', newQuestion);
    return newQuestion;
  },

  async getById(id: string): Promise<Question | null> {
    const q = db.get('questions', id);
    if (!q) return null;
    return { ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options };
  },

  async getByTheme(theme: string, limit: number = 20, offset: number = 0): Promise<Question[]> {
    const questions = db.query('questions', {
      where: (q) => q.theme === theme,
      limit,
      offset,
    });
    return questions.map(q => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }));
  },

  async getRandomByTheme(theme: string, count: number): Promise<Question[]> {
    const questions = db.query('questions', {
      where: (q) => q.theme === theme,
    });
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(q => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }));
  },

  async getAllThemes(): Promise<string[]> {
    const questions = db.getAll('questions');
    const themes = [...new Set(questions.map(q => q.theme))];
    return themes.sort();
  },

  async getForSpacedRepetition(userId: string, limit: number = 20): Promise<Question[]> {
    const now = new Date().toISOString();
    const reviews = db.query('question_reviews', {
      where: (r) => r.user_id === userId && r.next_review <= now,
      orderBy: (a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime(),
      limit,
    });
    
    const questionIds = reviews.map(r => r.question_id);
    const questions = questionIds.map(id => db.get('questions', id)).filter(Boolean);
    return questions.map(q => ({ ...q!, options: typeof q!.options === 'string' ? JSON.parse(q!.options) : q!.options }));
  },

  async search(query: string, limit: number = 20): Promise<Question[]> {
    const lowerQuery = query.toLowerCase();
    const questions = db.query('questions', {
      where: (q) => q.question_text.toLowerCase().includes(lowerQuery) || (q.explanation?.toLowerCase().includes(lowerQuery)),
      limit,
    });
    return questions.map(q => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }));
  }
};

export const reviewService = {
  async getOrCreate(userId: string, questionId: string): Promise<QuestionReview> {
    let review = db.find('question_reviews', r => r.user_id === userId && r.question_id === questionId) as QuestionReview | undefined;
    
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
      db.insert('question_reviews', review);
    }
    return review;
  },

  async update(review: QuestionReview): Promise<void> {
    db.update('question_reviews', review.id, review);
  },

  async getByUser(userId: string): Promise<QuestionReview[]> {
    return db.query('question_reviews', { where: (r) => r.user_id === userId }) as QuestionReview[];
  },

  async getDueCount(userId: string): Promise<number> {
    const now = new Date().toISOString();
    return db.query('question_reviews', { 
      where: (r) => r.user_id === userId && r.next_review <= now 
    }).length;
  }
};

export const progressService = {
  async update(userId: string, theme: string, isCorrect: boolean): Promise<UserProgress> {
    let progress = db.find('user_progress', p => p.user_id === userId && p.theme === theme) as UserProgress | undefined;
    
    if (!progress) {
      const id = genId();
      progress = { id, user_id: userId, theme, questions_attempted: 0, questions_correct: 0, average_score: 0 };
      db.insert('user_progress', progress);
    }
    
    progress.questions_attempted += 1;
    if (isCorrect) progress.questions_correct += 1;
    progress.average_score = progress.questions_correct / progress.questions_attempted;
    progress.last_practiced = new Date().toISOString();
    
    db.update('user_progress', progress.id, progress);
    return progress;
  },

  async getByUser(userId: string): Promise<UserProgress[]> {
    return db.query('user_progress', { 
      where: (p) => p.user_id === userId,
      orderBy: (a, b) => a.average_score - b.average_score,
    }) as UserProgress[];
  },

  async getOverallStats(userId: string): Promise<{ total_attempted: number; total_correct: number; overall_score: number; themes_practiced: number }> {
    const progress = await progressService.getByUser(userId);
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

export const examService = {
  async create(userId: string, questionIds: string[]): Promise<{ exam: PracticeExam; questions: PracticeExamQuestion[] }> {
    const examId = genId();
    const exam: PracticeExam = {
      id: examId,
      user_id: userId,
      total_questions: questionIds.length,
      correct_answers: 0,
      time_taken: 0,
      completed_at: new Date().toISOString()
    };
    
    db.insert('practice_exams', exam);
    
    const examQuestions: PracticeExamQuestion[] = questionIds.map(qId => {
      const id = genId();
      const eq: PracticeExamQuestion = { id, exam_id: examId, question_id: qId, time_spent: 0 };
      db.insert('practice_exam_questions', eq);
      return eq;
    });
    
    return { exam, questions: examQuestions };
  },

  async submit(examId: string, answers: Record<string, string>, timeTaken: number): Promise<PracticeExam> {
    const examQuestions = db.query('practice_exam_questions', { where: (q) => q.exam_id === examId });
    let correct = 0;
    
    for (const eq of examQuestions) {
      const question = await questionService.getById(eq.question_id);
      if (question && answers[eq.question_id] === question.correct_answer) {
        correct++;
        db.update('practice_exam_questions', eq.id, { user_answer: answers[eq.question_id], is_correct: true });
      } else {
        db.update('practice_exam_questions', eq.id, { user_answer: answers[eq.question_id] || '', is_correct: false });
      }
    }
    
    const score = (correct / examQuestions.length) * 100;
    db.update('practice_exams', examId, { correct_answers: correct, score, time_taken: timeTaken });
    
    const updatedExam = db.get('practice_exams', examId) as PracticeExam;
    return { ...updatedExam, score, correct_answers: correct, time_taken: timeTaken };
  },

  async getById(id: string): Promise<PracticeExam | null> {
    return db.get('practice_exams', id) as PracticeExam | null;
  },

  async getByUser(userId: string): Promise<PracticeExam[]> {
    return db.query('practice_exams', { 
      where: (e) => e.user_id === userId,
      orderBy: (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
    }) as PracticeExam[];
  },

  async getExamDetails(examId: string): Promise<{ exam: PracticeExam; questions: (PracticeExamQuestion & { question: Question })[] } | null> {
    const exam = await examService.getById(examId);
    if (!exam) return null;
    
    const examQuestions = db.query('practice_exam_questions', { where: (q) => q.exam_id === examId });
    const questions = await Promise.all(examQuestions.map(async eq => {
      const question = await questionService.getById(eq.question_id);
      return { ...eq, question: question! };
    }));
    
    return { exam, questions };
  },

  async generateStep2Exam(userId: string): Promise<{ exam: PracticeExam; questions: PracticeExamQuestion[] }> {
    const themes = await questionService.getAllThemes();
    const questionIds: string[] = [];
    const questionsPerTheme = Math.ceil(40 / themes.length);
    
    for (const theme of themes) {
      const qs = await questionService.getRandomByTheme(theme, questionsPerTheme);
      questionIds.push(...qs.map(q => q.id));
    }
    
    while (questionIds.length < 40) {
      const extra = await questionService.getRandomByTheme(themes[0], 40 - questionIds.length);
      questionIds.push(...extra.map(q => q.id));
    }
    
    return examService.create(userId, questionIds.slice(0, 40));
  }
};
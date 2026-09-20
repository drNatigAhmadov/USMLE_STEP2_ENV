import { Question, QuestionReview, UserProgress, PracticeExam, PracticeExamQuestion } from '../types';
export declare const questionService: {
    create(question: Omit<Question, "id" | "created_at">): Promise<Question>;
    getById(id: string): Promise<Question | null>;
    getByTheme(theme: string, limit?: number, offset?: number): Promise<Question[]>;
    getRandomByTheme(theme: string, count: number): Promise<Question[]>;
    getAllThemes(): Promise<string[]>;
    getForSpacedRepetition(userId: string, limit?: number): Promise<Question[]>;
    search(query: string, limit?: number): Promise<Question[]>;
};
export declare const reviewService: {
    getOrCreate(userId: string, questionId: string): Promise<QuestionReview>;
    update(review: QuestionReview): Promise<void>;
    getByUser(userId: string): Promise<QuestionReview[]>;
    getDueCount(userId: string): Promise<number>;
};
export declare const progressService: {
    update(userId: string, theme: string, isCorrect: boolean): Promise<UserProgress>;
    getByUser(userId: string): Promise<UserProgress[]>;
    getOverallStats(userId: string): Promise<{
        total_attempted: number;
        total_correct: number;
        overall_score: number;
        themes_practiced: number;
    }>;
};
export declare const examService: {
    create(userId: string, questionIds: string[]): Promise<{
        exam: PracticeExam;
        questions: PracticeExamQuestion[];
    }>;
    submit(examId: string, answers: Record<string, string>, timeTaken: number): Promise<PracticeExam>;
    getById(id: string): Promise<PracticeExam | null>;
    getByUser(userId: string): Promise<PracticeExam[]>;
    getExamDetails(examId: string): Promise<{
        exam: PracticeExam;
        questions: (PracticeExamQuestion & {
            question: Question;
        })[];
    } | null>;
    generateStep2Exam(userId: string): Promise<{
        exam: PracticeExam;
        questions: PracticeExamQuestion[];
    }>;
};
//# sourceMappingURL=database.d.ts.map
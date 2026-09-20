export interface Question {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation?: string;
  theme: string;
  subtheme?: string;
  difficulty: number;
  source: string;
}

export interface QuestionReview {
  id: string;
  user_id: string;
  question_id: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
  last_reviewed?: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  theme: string;
  questions_attempted: number;
  questions_correct: number;
  average_score: number;
  last_practiced?: string;
}

export interface PracticeExam {
  id: string;
  user_id: string;
  score?: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  completed_at: string;
}

export interface PracticeExamQuestion {
  id: string;
  exam_id: string;
  question_id: string;
  user_answer?: string;
  is_correct?: boolean;
  time_spent: number;
}

export interface MedQAQuestion {
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
  category?: string;
}

export interface ReviewRequest {
  question_id: string;
  quality: number;
}

export interface ExamSubmitRequest {
  answers: Record<string, string>;
  time_taken: number;
}
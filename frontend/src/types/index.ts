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
  next_review?: string;
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
  question?: Question;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
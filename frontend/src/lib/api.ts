import type { Question, QuestionReview, UserProgress, PracticeExam, PracticeExamQuestion } from '../types';

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const userId = localStorage.getItem('userId');
  return userId ? { 'x-user-id': userId } : {};
};

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API error');
  }
  
  return data;
}

export const api = {
  health: () => fetchApi<{ status: string }>('/health'),
  
  questions: {
    sync: () => fetchApi<{ synced: number; total: number }>('/questions/sync', { method: 'POST' }),
    getThemes: () => fetchApi<{ themes: string[] }>('/questions/themes'),
    getByTheme: (theme: string, limit = 20, offset = 0) => 
      fetchApi<{ questions: Question[] }>(`/questions/theme/${encodeURIComponent(theme)}?limit=${limit}&offset=${offset}`),
    getRandom: (theme: string, count = 10) =>
      fetchApi<{ questions: Question[] }>(`/questions/random/${encodeURIComponent(theme)}?count=${count}`),
    search: (query: string) =>
      fetchApi<{ questions: Question[] }>(`/questions/search?q=${encodeURIComponent(query)}`),
    getDue: (limit = 20) =>
      fetchApi<{ questions: Question[] }>(`/questions/due?limit=${limit}`),
  },

  reviews: {
    submit: (questionId: string, quality: number) =>
      fetchApi<{ review: QuestionReview; next_review: string }>('/reviews', {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId, quality }),
      }),
    answer: (questionId: string, userAnswer: string, confidence: 'low' | 'medium' | 'high' = 'medium') =>
      fetchApi<{
        correct: boolean;
        correct_answer: string;
        explanation?: string;
        next_review: string;
        ease_factor: number;
      }>('/reviews/answer', {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId, user_answer: userAnswer, confidence }),
      }),
  },

  progress: {
    getAll: () => fetchApi<{ progress: UserProgress[]; stats: any }>('/progress'),
    getTheme: (theme: string) => fetchApi<{ progress: UserProgress | null }>(`/progress/theme/${encodeURIComponent(theme)}`),
  },

  exams: {
    generateStep2: () => fetchApi<{ exam: PracticeExam; questions: PracticeExamQuestion[] }>('/exams/step2', { method: 'POST' }),
    submit: (examId: string, answers: Record<string, string>, timeTaken: number) =>
      fetchApi<{ exam: PracticeExam; details: any }>(`/exams/${examId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, time_taken: timeTaken }),
      }),
    getAll: () => fetchApi<{ exams: PracticeExam[] }>('/exams'),
    getById: (examId: string) => fetchApi<{ exam: PracticeExam; questions: (PracticeExamQuestion & { question: Question })[] }>(`/exams/${examId}`),
  },

  stats: {
    getReviews: () => fetchApi<{ due: number; learning: number; mature: number; total: number }>('/stats/reviews'),
  },
};

export function setUserId(userId: string) {
  localStorage.setItem('userId', userId);
}

export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export function clearUserId() {
  localStorage.removeItem('userId');
}
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getScoreColor, formatDuration } from '../lib/utils';

interface ExamDetail {
  exam: any;
  questions: Array<{
    id: string;
    exam_id: string;
    question_id: string;
    user_answer?: string;
    is_correct?: boolean;
    time_spent: number;
    question: {
      id: string;
      question_text: string;
      options: Record<string, string>;
      correct_answer: string;
      explanation?: string;
      theme: string;
      subtheme?: string;
      difficulty: number;
      source: string;
    };
  }>;
}

export function ExamResults() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  const loadExam = async () => {
    try {
      const res = await api.exams.getById(examId!);
      setExam(res);
    } catch (error) {
      console.error('Failed to load exam:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600">Exam not found</p>
        <Link to="/exam" className="btn btn-primary mt-4 inline-block">Back to Exams</Link>
      </div>
    );
  }

  const { exam: examData, questions } = exam;
  const score = examData.score || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Results</h1>
        <div className="flex items-center justify-center gap-8 mt-4 mb-4">
          <div>
            <p className="text-4xl font-bold" style={{ color: getScoreColor(score) }}>
              {Math.round(score)}%
            </p>
            <p className="text-slate-600">Overall Score</p>
          </div>
          <div className="border-l border-slate-200 pl-8">
            <p className="text-2xl font-bold text-slate-900">
              {examData.correct_answers}/{examData.total_questions}
            </p>
            <p className="text-slate-600">Correct</p>
          </div>
          <div className="border-l border-slate-200 pl-8">
            <p className="text-2xl font-bold text-slate-900">
              {formatDuration(examData.time_taken || 0)}
            </p>
            <p className="text-slate-600">Time Taken</p>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Link to="/exam" className="btn btn-primary">Take Another Exam</Link>
          <Link to="/progress" className="btn btn-secondary">View Progress</Link>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Question Review</h2>
        <div className="space-y-6">
          {questions.map((eq, index) => {
            const q = eq.question;
            const isCorrect = eq.is_correct;
            const userAnswer = eq.user_answer;
            
            return (
              <div
                key={eq.id}
                className={`border-l-4 p-4 rounded-r-lg ${
                  isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{q.question_text}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`badge ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                    <span className="text-sm text-slate-500">Q{index + 1}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {Object.entries(q.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        key === q.correct_answer
                          ? 'bg-green-50 text-green-900'
                          : key === userAnswer
                          ? 'bg-red-50 text-red-900'
                          : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0">
                        {key}
                      </span>
                      <span className="flex-1">{value}</span>
                      {key === q.correct_answer && <span className="text-green-600">✓</span>}
                      {key === userAnswer && key !== q.correct_answer && <span className="text-red-600">✗</span>}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-900 mb-1">Explanation</p>
                    <p className="text-blue-800 text-sm">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
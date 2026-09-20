import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { QuestionViewer } from '../components/QuestionViewer';
import { Question } from '../types';
import { formatRelativeTime } from '../lib/utils';

export function SpacedRepetition() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ due: 0, learning: 0, mature: 0, total: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [questionsRes, statsRes] = await Promise.all([
        api.questions.getDue(20),
        api.stats.getReviews(),
      ]);
      setQuestions(questionsRes.questions);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load spaced repetition:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const userAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = async (answer: string, confidence: 'low' | 'medium' | 'high') => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    
    try {
      setSubmitting(true);
      await api.reviews.answer(currentQuestion.id, answer, confidence);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
    
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (sessionComplete || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto card text-center">
        {questions.length === 0 ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">All Caught Up!</h2>
            <p className="text-slate-600 mb-6">No questions due for review right now.</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.due}</p>
                <p className="text-sm text-red-700">Due</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.learning}</p>
                <p className="text-sm text-yellow-700">Learning</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.mature}</p>
                <p className="text-sm text-green-700">Mature</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Session Complete!</h2>
            <p className="text-slate-600 mb-6">Great job! You've reviewed all due questions.</p>
          </>
        )}
        <div className="flex gap-4 justify-center">
          <button onClick={loadData} className="btn btn-primary">Check Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spaced Repetition</h1>
          <p className="text-slate-600">Review {questions.length} due questions</p>
        </div>
        <div className="text-sm text-slate-500">
          Next review: {formatRelativeTime(questions[currentIndex]?.next_review || '')}
        </div>
      </div>

      <div className="flex gap-2" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={questions.length}>
        {questions.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < currentIndex
                ? 'bg-green-500'
                : i === currentIndex
                ? 'bg-primary-600'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <QuestionViewer
        question={currentQuestion!}
        onAnswer={handleAnswer}
        showExplanation={showExplanation}
        userAnswer={userAnswer}
        correctAnswer={showExplanation ? currentQuestion?.correct_answer : undefined}
      />

      {showExplanation && (
        <div className="flex gap-3">
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => handleAnswer(userAnswer!, 'low')}
              className="btn btn-secondary flex-1"
              disabled={!userAnswer || submitting}
            >
              Hard (Again)
            </button>
            <button
              onClick={() => handleAnswer(userAnswer!, 'medium')}
              className="btn btn-primary flex-1"
              disabled={!userAnswer || submitting}
            >
              Good
            </button>
            <button
              onClick={() => handleAnswer(userAnswer!, 'high')}
              className="btn btn-secondary flex-1"
              disabled={!userAnswer || submitting}
            >
              Easy
            </button>
          </div>
        </div>
      )}

      {!showExplanation && (
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="btn btn-secondary"
            disabled={!userAnswer}
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
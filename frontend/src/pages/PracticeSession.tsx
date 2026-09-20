import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { QuestionViewer } from '../components/QuestionViewer';
import { Question } from '../types';
import { formatDuration } from '../lib/utils';

export function PracticeSession() {
  const { theme } = useParams<{ theme: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const decodedTheme = theme ? decodeURIComponent(theme) : '';

  useEffect(() => {
    if (decodedTheme) {
      loadQuestions();
    }
  }, [decodedTheme]);

  const loadQuestions = async () => {
    try {
      const res = await api.questions.getRandom(decodedTheme, 10);
      setQuestions(res.questions);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const userAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (answer: string, _confidence: 'low' | 'medium' | 'high') => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
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

  const handleFinish = () => {
    navigate('/progress');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (sessionComplete) {
    const correct = Object.entries(answers).filter(
      ([qId, ans]) => {
        const q = questions.find(q => q.id === qId);
        return q && ans === q.correct_answer;
      }
    ).length;
    const score = Math.round((correct / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto card text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Complete!</h2>
        <p className="text-slate-600 mb-6">You've completed all questions for {decodedTheme}</p>
        <div className="text-4xl font-bold mb-2">{score}%</div>
        <div className="text-slate-600 mb-6">{correct} of {questions.length} correct</div>
        <div className="flex gap-4 justify-center">
          <button onClick={handleFinish} className="btn btn-primary">View Progress</button>
          <button onClick={() => navigate('/themes')} className="btn btn-secondary">Back to Topics</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600">No questions available for this topic.</p>
      </div>
    );
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{decodedTheme}</h1>
          <p className="text-slate-600">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <div className="text-sm text-slate-500">⏱ {formatDuration(elapsed)}</div>
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
        question={currentQuestion}
        onAnswer={handleAnswer}
        showExplanation={showExplanation}
        userAnswer={userAnswer}
        correctAnswer={showExplanation ? currentQuestion.correct_answer : undefined}
      />

      {showExplanation && (
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className={`btn flex-1 ${isLastQuestion ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isLastQuestion ? 'Finish Session' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
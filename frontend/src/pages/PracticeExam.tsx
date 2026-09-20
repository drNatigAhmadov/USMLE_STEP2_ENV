import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { QuestionViewer } from '../components/QuestionViewer';
import type { Question, PracticeExam as PracticeExamType, PracticeExamQuestion } from '../types';
import { formatDuration } from '../lib/utils';

export function PracticeExam() {
  const navigate = useNavigate();
  const [exam, setExam] = useState<PracticeExamType | null>(null);
  const [questions, setQuestions] = useState<Array<PracticeExamQuestion & { question?: Question }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [examStarted, setExamStarted] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.exams.generateStep2();
      setExam(res.exam);
      setQuestions(res.questions);
      setExamStarted(true);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to generate exam:', error);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!exam) return;
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      const res = await api.exams.submit(exam.id, answers, timeTaken);
      navigate(`/exam/${res.exam.id}`);
    } catch (error) {
      console.error('Failed to submit exam:', error);
    }
  };

  const currentQuestion = questions[currentIndex]?.question;
  const userAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (answer: string, _confidence: 'low' | 'medium' | 'high') => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (isLastQuestion) return;
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex(prev => prev - 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto card text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">USMLE Step 2 CK Mock Exam</h1>
        <p className="text-slate-600 mb-8">A 40-question timed practice exam covering all major topics</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium text-slate-900">40 Questions</p>
            <p className="text-sm text-slate-600">All Step 2 CK topics</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium text-slate-900">Timed</p>
            <p className="text-sm text-slate-600">Track your pace</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium text-slate-900">Instant Scoring</p>
            <p className="text-sm text-slate-600">Detailed explanations</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium text-slate-900">Review Mode</p>
            <p className="text-sm text-slate-600">Flag & review questions</p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn btn-primary w-full text-lg py-4"
        >
          {generating ? 'Generating Exam...' : 'Start Mock Exam'}
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600">Loading questions...</p>
      </div>
    );
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mock Exam</h1>
          <p className="text-slate-600">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold text-primary-600">⏱ {formatDuration(elapsed)}</p>
          <p className="text-sm text-slate-500">{answeredCount}/{questions.length} answered</p>
        </div>
      </div>

      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <QuestionViewer
            question={currentQuestion}
            onAnswer={handleAnswer}
            showExplanation={false}
            userAnswer={userAnswer}
          />

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <div className="flex gap-2">
              {questions.map((eq, i) => {
                const q = eq.question;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      i === currentIndex
                        ? 'bg-primary-600 text-white'
                        : q && answers[q.id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleNext}
              disabled={isLastQuestion}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-5 gap-1 mb-4">
              {questions.map((eq, i) => {
                const q = eq.question;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-full h-8 rounded text-xs font-medium ${
                      i === currentIndex
                        ? 'bg-primary-600 text-white'
                        : q && answers[q.id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600 mb-2">
                {answeredCount} of {questions.length} answered
              </p>
              <button
                onClick={handleSubmit}
                disabled={answeredCount < questions.length}
                className="btn btn-primary w-full"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
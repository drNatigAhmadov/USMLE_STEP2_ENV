import { Question } from '../types';
import { getDifficultyColor, getDifficultyLabel } from '../lib/utils';

interface QuestionViewerProps {
  question: Question;
  onAnswer: (answer: string, confidence: 'low' | 'medium' | 'high') => void;
  showExplanation?: boolean;
  userAnswer?: string;
  correctAnswer?: string;
  disabled?: boolean;
}

export function QuestionViewer({
  question,
  onAnswer,
  showExplanation = false,
  userAnswer,
  correctAnswer,
  disabled = false,
}: QuestionViewerProps) {
  const options = Object.entries(question.options);
  const isAnswered = userAnswer !== undefined;

  const handleOptionClick = (optionKey: string) => {
    if (!disabled && !isAnswered) {
      onAnswer(optionKey, 'medium');
    }
  };

  return (
    <div className="card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-lg font-medium text-slate-900 leading-relaxed">
            {question.question_text}
          </p>
        </div>
        <span className={`badge ${getDifficultyColor(question.difficulty)} shrink-0`}>
          {getDifficultyLabel(question.difficulty)}
        </span>
      </div>

      <div className="space-y-2">
        {options.map(([key, value]) => {
          let variant = 'default';
          if (isAnswered) {
            if (key === correctAnswer) variant = 'correct';
            else if (key === userAnswer) variant = 'incorrect';
          }
          
          return (
            <button
              key={key}
              onClick={() => handleOptionClick(key)}
              disabled={disabled || isAnswered}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                variant === 'correct'
                  ? 'bg-green-50 border-green-300 text-green-900'
                  : variant === 'incorrect'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-medium">
                  {key}
                </span>
                <span className="flex-1">{value}</span>
                {isAnswered && key === correctAnswer && (
                  <span className="text-green-600">✓</span>
                )}
                {isAnswered && key === userAnswer && key !== correctAnswer && (
                  <span className="text-red-600">✗</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showExplanation && question.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
          <p className="text-blue-800 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {showExplanation && (
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>Theme: <span className="font-medium text-slate-700">{question.theme}</span></span>
          {question.subtheme && (
            <span>Subtheme: <span className="font-medium text-slate-700">{question.subtheme}</span></span>
          )}
        </div>
      )}
    </div>
  );
}
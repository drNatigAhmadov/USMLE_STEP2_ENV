import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getScoreColor } from '../lib/utils';

interface ThemeProgress {
  theme: string;
  questions_attempted: number;
  questions_correct: number;
  average_score: number;
}

export function ThemeSelector() {
  const [themes, setThemes] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, ThemeProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [themesRes, progressRes] = await Promise.all([
        api.questions.getThemes(),
        api.progress.getAll(),
      ]);
      setThemes(themesRes.themes);
      const progressMap: Record<string, ThemeProgress> = {};
      progressRes.progress.forEach((p: ThemeProgress) => {
        progressMap[p.theme] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Failed to load themes:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practice by Topic</h1>
        <p className="text-slate-600 mt-1">Select a topic to practice questions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const themeProgress = progress[theme];
          const attempted = themeProgress?.questions_attempted || 0;
          const score = themeProgress?.average_score || 0;
          
          return (
            <Link
              key={theme}
              to={`/practice/${encodeURIComponent(theme)}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{theme}</h3>
                  {attempted > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-slate-600">
                        {attempted} questions attempted
                      </span>
                      <span className={`font-medium ${getScoreColor(score * 100)}`}>
                        {Math.round(score * 100)}% correct
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-primary-600">→</span>
              </div>
              {attempted > 0 && (
                <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      getScoreColor(score * 100).replace('text-', 'bg-')
                    }`}
                    style={{ width: `${score * 100}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {themes.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-slate-600 mb-4">No topics available yet.</p>
          <button
            onClick={async () => {
              await api.questions.sync();
              loadData();
            }}
            className="btn btn-primary"
          >
            Sync Questions from MedQA
          </button>
        </div>
      )}
    </div>
  );
}
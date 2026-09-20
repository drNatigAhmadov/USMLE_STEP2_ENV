import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getScoreColor, formatRelativeTime } from '../lib/utils';

interface DashboardStats {
  total_attempted: number;
  total_correct: number;
  overall_score: number;
  themes_practiced: number;
}

interface DueReviews {
  due: number;
  learning: number;
  mature: number;
  total: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_attempted: 0,
    total_correct: 0,
    overall_score: 0,
    themes_practiced: 0,
  });
  const [reviews, setReviews] = useState<DueReviews>({
    due: 0,
    learning: 0,
    mature: 0,
    total: 0,
  });
  const [recentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progressRes, reviewsRes] = await Promise.all([
        api.progress.getAll(),
        api.stats.getReviews(),
      ]);
      setStats(progressRes.stats);
      setReviews(reviewsRes);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
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

  const statCards = [
    { label: 'Questions Attempted', value: stats.total_attempted, icon: '📝' },
    { label: 'Correct Answers', value: stats.total_correct, icon: '✅' },
    { label: 'Overall Score', value: `${Math.round(stats.overall_score * 100)}%`, icon: '📊' },
    { label: 'Topics Practiced', value: stats.themes_practiced, icon: '📚' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's your progress overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Spaced Repetition</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{reviews.due}</p>
              <p className="text-sm text-red-700">Due Now</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{reviews.learning}</p>
              <p className="text-sm text-yellow-700">Learning</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{reviews.mature}</p>
              <p className="text-sm text-green-700">Mature</p>
            </div>
          </div>
          {reviews.due > 0 && (
            <Link to="/spaced-repetition" className="mt-4 block btn btn-primary w-full text-center">
              Start Review ({reviews.due} due)
            </Link>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/themes" className="btn btn-secondary text-center">
              Practice by Topic
            </Link>
            <Link to="/exam" className="btn btn-primary text-center">
              Mock Exam
            </Link>
            <Link to="/spaced-repetition" className="btn btn-secondary text-center">
              Spaced Review
            </Link>
            <Link to="/progress" className="btn btn-outline text-center">
              View Progress
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Practice Exams</h2>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No practice exams taken yet. Start with a mock exam!</p>
          ) : (
            recentActivity.map((exam) => (
              <Link
                key={exam.id}
                to={`/exam/${exam.id}`}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">Practice Exam</p>
                  <p className="text-sm text-slate-500">{formatRelativeTime(exam.completed_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getScoreColor(exam.score || 0)}`}>
                    {Math.round(exam.score || 0)}%
                  </p>
                  <p className="text-sm text-slate-500">
                    {exam.correct_answers}/{exam.total_questions}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
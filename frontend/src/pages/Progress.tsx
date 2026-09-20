import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getScoreColor } from '../lib/utils';

interface ProgressData {
  progress: any[];
  stats: any;
}

export function Progress() {
  const [data, setData] = useState<ProgressData>({ progress: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.progress.getAll();
      setData(res);
    } catch (error) {
      console.error('Failed to load progress:', error);
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

  const { progress, stats } = data;

  const COLORS = [
    '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];

  const chartData = progress.map((p, i) => ({
    theme: p.theme.length > 15 ? p.theme.slice(0, 15) + '...' : p.theme,
    score: Math.round(p.average_score * 100),
    attempted: p.questions_attempted,
    correct: p.questions_correct,
    color: COLORS[i % COLORS.length],
  }));

  const pieData = [
    { name: 'Correct', value: stats.total_correct || 0, color: '#22c55e' },
    { name: 'Incorrect', value: (stats.total_attempted || 0) - (stats.total_correct || 0), color: '#ef4444' },
  ];

  if (progress.length === 0) {
    return (
      <div className="card text-center py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Progress Data Yet</h2>
        <p className="text-slate-600 mb-6">Start practicing to see your progress here</p>
        <a href="/themes" className="btn btn-primary">Browse Topics</a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Progress Overview</h1>
        <p className="text-slate-600 mt-1">Track your performance across topics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-slate-600">Total Questions</p>
          <p className="text-3xl font-bold text-slate-900">{stats.total_attempted || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-600">Correct Answers</p>
          <p className="text-3xl font-bold text-green-600">{stats.total_correct || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-600">Overall Score</p>
          <p className="text-3xl font-bold" style={{ color: getScoreColor((stats.overall_score || 0) * 100) }}>
            {Math.round((stats.overall_score || 0) * 100)}%
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-600">Topics Practiced</p>
          <p className="text-3xl font-bold text-slate-900">{stats.themes_practiced || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Score by Topic</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="theme" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Overall Accuracy</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="200" height="200">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, 'Questions']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Detailed Topic Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium text-slate-600">Topic</th>
                <th className="pb-3 font-medium text-slate-600 text-right">Attempted</th>
                <th className="pb-3 font-medium text-slate-600 text-right">Correct</th>
                <th className="pb-3 font-medium text-slate-600 text-right">Score</th>
                <th className="pb-3 font-medium text-slate-600">Progress</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-900">{p.theme}</td>
                  <td className="py-3 text-right text-slate-600">{p.questions_attempted}</td>
                  <td className="py-3 text-right text-green-600">{p.questions_correct}</td>
                  <td className="py-3 text-right font-medium" style={{ color: getScoreColor(p.average_score * 100) }}>
                    {Math.round(p.average_score * 100)}%
                  </td>
                  <td className="py-3">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreColor(p.average_score * 100).replace('text-', 'bg-')}`}
                        style={{ width: `${p.average_score * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
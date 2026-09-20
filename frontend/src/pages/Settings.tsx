import { useState } from 'react';
import { api } from '../lib/api';
import { useUser } from '../context/UserContext';

export function Settings() {
  const { userId, clearUser } = useUser();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.questions.sync();
      setSyncResult(`Synced ${res.synced} new questions from MedQA dataset (${res.total} total)`);
    } catch (error) {
      setSyncResult('Failed to sync questions. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account and data</p>
      </div>

      <div className="card space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
            <div className="input bg-slate-50 font-mono text-sm">{userId}</div>
          </div>
          <button
            onClick={clearUser}
            className="btn btn-outline"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="card space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Data Management</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-2">
              Sync the latest questions from the MedQA dataset (USMLE questions from Hugging Face).
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary"
            >
              {syncing ? 'Syncing...' : 'Sync Questions from MedQA'}
            </button>
            {syncResult && (
              <p className="text-sm text-slate-600">{syncResult}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">About</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <p><strong>USMLE Step 2 CK Practice Platform</strong></p>
          <p>Version 1.0.0</p>
          <p>Built with React, TypeScript, Node.js, and SQLite</p>
          <p>Questions sourced from MedQA dataset (Hugging Face)</p>
          <p>Spaced repetition powered by SM-2 algorithm</p>
        </div>
      </div>
    </div>
  );
}
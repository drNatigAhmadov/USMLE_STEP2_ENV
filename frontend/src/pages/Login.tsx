import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export function Login() {
  const { setUserId } = useUser();
  const navigate = useNavigate();
  const [userId, setUserIdInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      setUserId(userId.trim());
      navigate('/');
    }
  };

  const handleDemoLogin = () => {
    const demoId = `demo-${Date.now()}`;
    setUserId(demoId);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">USMLE Step 2 CK Practice</h1>
          <p className="text-slate-600 mt-2">Sign in to continue your preparation</p>
        </div>

        <div className="card space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-slate-700 mb-1">
                User ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="Enter your user ID"
                className="input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Sign In
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            className="btn btn-outline w-full"
          >
            Continue as Demo User
          </button>

          <p className="text-xs text-slate-500 text-center">
            Demo users get a temporary ID. Progress is saved locally.
          </p>
        </div>
      </div>
    </div>
  );
}
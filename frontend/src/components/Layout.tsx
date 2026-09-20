import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { ReactNode } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/themes', label: 'Topics', icon: '📚' },
  { path: '/spaced-repetition', label: 'Review', icon: '🔄' },
  { path: '/exam', label: 'Mock Exam', icon: '📝' },
  { path: '/progress', label: 'Progress', icon: '📈' },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { userId, clearUser } = useUser();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-primary-600">
              USMLE Step 2 CK
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">
                User: {userId?.slice(0, 8)}...
              </span>
              <button
                onClick={clearUser}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { Dashboard } from './pages/Dashboard';
import { ThemeSelector } from './pages/ThemeSelector';
import { PracticeSession } from './pages/PracticeSession';
import { SpacedRepetition } from './pages/SpacedRepetition';
import { PracticeExam } from './pages/PracticeExam';
import { ExamResults } from './pages/ExamResults';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';

function ProtectedRoutes() {
  const { userId } = useUser();
  
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/themes" element={<ThemeSelector />} />
        <Route path="/practice/:theme" element={<PracticeSession />} />
        <Route path="/spaced-repetition" element={<SpacedRepetition />} />
        <Route path="/exam" element={<PracticeExam />} />
        <Route path="/exam/:examId" element={<ExamResults />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
import { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(() => {
    return localStorage.getItem('userId');
  });

  const setUserId = (id: string) => {
    localStorage.setItem('userId', id);
    setUserIdState(id);
  };

  const clearUser = () => {
    localStorage.removeItem('userId');
    setUserIdState(null);
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
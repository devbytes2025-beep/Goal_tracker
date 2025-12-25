import React, { createContext, useContext, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, AppData, Task, TaskLog } from './types';
import { backend, generateUUID } from './services/mockBackend';
import { Layout } from './components/Layout';
import { getMotivationalQuote } from './services/geminiService';
import { ToastContainer, ToastType } from './components/UI';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Todos from './pages/Todos';
import Expenses from './pages/Expenses';
import CalendarPage from './pages/CalendarPage';
import Journal from './pages/Journal';
import ProofWall from './pages/ProofWall';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { playSound } from './constants';

// Context
interface AppContextType {
  user: User | null;
  data: AppData;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  loginUser: (u: User) => void;
  updateUser: (u: User) => void;
  logoutUser: () => void;
  dailyQuote: string;
  showToast: (message: string, type: ToastType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useApp();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white bg-black/90">
      <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse">Loading GlassHabit...</p>
      </div>
  </div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppContent = () => {
   // Location listener for sound effects
   const location = useLocation();
   useEffect(() => {
     if (location.pathname !== '/login') {
         playSound('nav');
     }
   }, [location.pathname]);

   return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/todos" element={<ProtectedRoute><Todos /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        <Route path="/proof" element={<ProtectedRoute><ProofWall /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
   )
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>({ tasks: [], logs: [], todos: [], expenses: [], journal: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [dailyQuote, setDailyQuote] = useState("Loading inspiration...");
  
  // Toast State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  const showToast = (message: string, type: ToastType) => {
      const id = generateUUID();
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshData = async () => {
    if (user) {
      try {
          const d = await backend.getData(user.id);
          setData(d);
      } catch (e) {
          console.error(e);
          showToast("Failed to refresh data", "error");
      }
    }
  };

  useEffect(() => {
    // Correctly handle auth persistence using Firebase observer
    const unsubscribe = backend.subscribeToAuth(async (u) => {
        if (u) {
            setUser(u);
            localStorage.setItem('glasshabit_user', JSON.stringify(u));
            try {
                const d = await backend.getData(u.id);
                setData(d);
            } catch (e: any) {
                if (e?.code !== 'permission-denied') {
                    console.error("Data load error", e);
                }
            }
        } else {
            setUser(null);
            setData({ tasks: [], logs: [], todos: [], expenses: [], journal: [] });
            localStorage.removeItem('glasshabit_user');
        }
        setIsLoading(false);
    });

    getMotivationalQuote().then(setDailyQuote);
    
    return () => unsubscribe();
  }, []);

  const loginUser = (u: User) => {
    // This helper now primarily updates local state immediately for UX responsiveness
    // The real source of truth is the subscribeToAuth callback above
    setUser(u);
    localStorage.setItem('glasshabit_user', JSON.stringify(u));
    // We can optimistically fetch data, but subscribeToAuth will also trigger
    backend.getData(u.id)
        .then((d) => {
            setData(d);
            showToast(`Welcome back, ${u.username}!`, 'success');
        })
        .catch(err => {
            console.error("Login data fetch error", err);
        });
  };

  const updateUser = (u: User) => {
      setUser(u);
      localStorage.setItem('glasshabit_user', JSON.stringify(u));
  }

  const logoutUser = async () => {
    await backend.logout();
    setUser(null);
    localStorage.removeItem('glasshabit_user');
    showToast("Logged out successfully", 'info');
  };

  return (
    <AppContext.Provider value={{ user, data, isLoading, refreshData, loginUser, updateUser, logoutUser, dailyQuote, showToast }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <HashRouter>
         <AppContent />
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
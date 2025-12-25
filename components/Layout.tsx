import React, { useState } from 'react';
import { 
  Home, CheckSquare, ListTodo, Wallet, Calendar as CalendarIcon, 
  BookOpen, Award, BarChart2, User as UserIcon, Settings, Menu, X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, label, active, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-white/20 text-white shadow-lg border border-white/10' 
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggle = () => setIsOpen(!isOpen);

  const navs = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Habits & Goals' },
    { to: '/todos', icon: ListTodo, label: 'To-Do List' },
    { to: '/expenses', icon: Wallet, label: 'Expenses' },
    { to: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    { to: '/journal', icon: BookOpen, label: 'Journal' },
    { to: '/proof', icon: Award, label: 'Proof Wall' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/profile', icon: UserIcon, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen overflow-hidden bg-transparent">
      {/* Mobile Menu Button */}
      <button 
        onClick={toggle} 
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white backdrop-blur-md border border-white/10"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
        glass-panel border-r border-white/10 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">
            GlassHabit
          </h1>
          <p className="text-xs text-gray-400 mt-1">Build your future</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
          {navs.map((nav) => (
            <NavItem 
              key={nav.to} 
              {...nav} 
              active={location.pathname === nav.to} 
              onClick={() => setIsOpen(false)}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
            {children}
        </div>
      </main>
    </div>
  );
};

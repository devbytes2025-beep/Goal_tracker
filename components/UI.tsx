import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`glass-panel p-6 rounded-2xl ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'ghost' }> = ({ 
  children, className = '', variant = 'primary', ...props 
}) => {
  const base = "px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const styles = {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white shadow-lg shadow-red-500/20",
    ghost: "bg-white/10 hover:bg-white/20 text-white border border-white/10"
  };
  
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    className="w-full glass-input px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select 
    className="w-full glass-input px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 transition-all text-white appearance-none cursor-pointer"
    {...props}
  >
    {props.children}
  </select>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl animate-[scaleIn_0.2s_ease-out] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Toast System ---

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-400" size={20} />,
    error: <AlertCircle className="text-red-400" size={20} />,
    info: <Info className="text-blue-400" size={20} />
  };

  const bgColors = {
    success: 'bg-green-900/40 border-green-500/30',
    error: 'bg-red-900/40 border-red-500/30',
    info: 'bg-blue-900/40 border-blue-500/30'
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg animate-[slideIn_0.3s_ease-out] mb-3 ${bgColors[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium text-white">{message}</p>
      <button onClick={() => onClose(id)} className="ml-auto text-white/50 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: { id: string; message: string; type: ToastType }[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col w-full max-w-xs">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onClose={removeToast} />
      ))}
    </div>
  );
};

// --- Animations ---

export const SparkleEffect: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  // Modern explosive sparkles from center
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] flex items-center justify-center">
       {Array.from({length: 12}).map((_, i) => (
         <div 
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-boom"
            style={{
                transform: `rotate(${i * 30}deg) translate(0, 0)`,
                '--tw-translate-y': `-${100 + Math.random() * 50}px`
            } as any}
         ></div>
       ))}
       <div className="animate-boom absolute w-32 h-32 border-4 border-indigo-400 rounded-full opacity-0"></div>
    </div>
  );
};

export const BoomEffect: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-[70] flex items-center justify-center">
             <div className="absolute w-full h-1 bg-white/50 animate-boom" style={{transform: 'rotate(0deg)'}}></div>
             <div className="absolute w-full h-1 bg-white/50 animate-boom" style={{transform: 'rotate(45deg)'}}></div>
             <div className="absolute w-full h-1 bg-white/50 animate-boom" style={{transform: 'rotate(90deg)'}}></div>
             <div className="absolute w-full h-1 bg-white/50 animate-boom" style={{transform: 'rotate(135deg)'}}></div>
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center scale-150 transition-transform duration-500">
                 <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 animate-[pulse_0.5s_ease-in-out]">
                     LEVEL UP!
                 </h1>
             </div>
        </div>
    );
}

export const FireworksEffect: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-[70] overflow-hidden">
             {/* Simulating fireworks with CSS particles */}
             <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-[ping_1s_ease-out_infinite]"></div>
             <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-blue-500 rounded-full animate-[ping_1.2s_ease-out_infinite]"></div>
             <div className="absolute top-1/3 left-2/3 w-4 h-4 bg-green-500 rounded-full animate-[ping_0.8s_ease-out_infinite]"></div>
             <div className="absolute top-2/3 left-1/2 w-4 h-4 bg-yellow-500 rounded-full animate-[ping_1.5s_ease-out_infinite]"></div>
        </div>
    );
}

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-indigo-500/20 text-indigo-200" }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-medium border border-white/5 ${color}`}>
    {children}
  </span>
);
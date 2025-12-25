export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  dob?: string;
  gender?: string;
  securityQuestion?: string; 
  secretKeyAnswer: string; // Encrypted in real app
  theme: 'light' | 'dark';
  name?: string; // Full Name
  points: number;
}

export enum TaskType {
  HEALTH = 'HEALTH',
  WEALTH = 'WEALTH',
  PERSONAL = 'PERSONAL',
  CAREER = 'CAREER',
  RELATIONSHIPS = 'RELATIONSHIPS',
  OTHER = 'OTHER'
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  reason: string; // "Why"
  type: TaskType;
  category: 'habit' | 'goal';
  penalty: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface TaskLog {
  id: string;
  taskId: string;
  date: string; // ISO date YYYY-MM-DD
  remark: string;
  images?: string[]; // Base64 array
  completed: boolean;
  timestamp: number;
}

export interface Todo {
  id: string;
  userId: string;
  text: string;
  dueDate: string;
  completed: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  subject: string;
  content: string;
  mood: string; // Emoji char
  images?: string[];
  date: string;
  timestamp: number;
}

export interface AppData {
  tasks: Task[];
  logs: TaskLog[];
  todos: Todo[];
  expenses: Expense[];
  journal: JournalEntry[];
}

// Chart types
export interface ChartDataPoint {
  name: string;
  value: number;
}

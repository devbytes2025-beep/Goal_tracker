import { User, Task, TaskLog, Todo, Expense, JournalEntry, AppData } from '../types';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateEmail,
  sendEmailVerification,
  User as FirebaseUser
} from "firebase/auth";

// --- Configuration ---
// Note: This implementation uses LocalStorage for data persistence to ensure the app works 
// without a running backend server. Authentication is still handled by Firebase.

const firebaseConfig = {
  apiKey: "AIzaSyCxz9DyLfrdh21laP3H2OwPqLQSBfZl25I",
  authDomain: "life-tracker-71b6a.firebaseapp.com",
  projectId: "life-tracker-71b6a",
  storageBucket: "life-tracker-71b6a.firebasestorage.app",
  messagingSenderId: "895144544294",
  appId: "1:895144544294:web:3a9a1964f4daf7d1383ee7",
  measurementId: "G-E32X53PLHC"
};

// Initialize Firebase (Auth Only)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- LocalStorage Helpers ---
const STORAGE_PREFIX = 'glasshabit_';

const getStoredData = (userId: string): AppData => {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}data_${userId}`);
    if (!raw) return { tasks: [], logs: [], todos: [], expenses: [], journal: [] };
    return JSON.parse(raw);
};

const setStoredData = (userId: string, data: AppData) => {
    localStorage.setItem(`${STORAGE_PREFIX}data_${userId}`, JSON.stringify(data));
};

const getStoredUser = (userId: string): User | null => {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}user_${userId}`);
    return raw ? JSON.parse(raw) : null;
};

const setStoredUser = (user: User) => {
    localStorage.setItem(`${STORAGE_PREFIX}user_${user.id}`, JSON.stringify(user));
};

class MockBackendService {

  // --- Auth & User Management ---

  subscribeToAuth(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
          try {
              // Check local storage for extended user profile
              let user = getStoredUser(firebaseUser.uid);
              
              if (!user) {
                  // If firebase user exists but local profile doesn't (first load or cleared cache)
                  // Create a default profile or attempt to recover
                   user = {
                      id: firebaseUser.uid,
                      username: firebaseUser.email?.split('@')[0] || 'User',
                      email: firebaseUser.email || '',
                      secretKeyAnswer: 'default',
                      theme: 'dark',
                      points: 0
                  };
                  setStoredUser(user);
              }
              callback(user);
          } catch (e) {
              console.error("Auth Sync Error:", e);
              callback(null);
          }
      } else {
        callback(null);
      }
    });
  }

  async register(userData: Omit<User, 'id' | 'theme' | 'points'>, password: string): Promise<User> {
    // 1. Create Auth User in Firebase
    let cred;
    try {
        cred = await createUserWithEmailAndPassword(auth, userData.email, password);
        await sendEmailVerification(cred.user);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Email is already registered.");
        }
        throw error;
    }

    // 2. Save User Profile Locally
    const newUser: User = { 
        ...userData, 
        id: cred.user.uid, 
        theme: 'dark', 
        points: 0 
    };

    setStoredUser(newUser);
    return newUser;
  }

  async login(usernameOrEmail: string, password: string): Promise<User> {
    try {
        let emailToUse = usernameOrEmail;
        
        // Simple username lookup implementation for LocalStorage
        if (!usernameOrEmail.includes('@')) {
            // Try to find a user key that contains this username
            // Note: This is inefficient but acceptable for a mock/single-user tailored experience
            let foundEmail = null;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(`${STORAGE_PREFIX}user_`)) {
                    const u = JSON.parse(localStorage.getItem(key)!);
                    if (u.username === usernameOrEmail) {
                        foundEmail = u.email;
                        break;
                    }
                }
            }
            if (!foundEmail) throw new Error("Username not found. Please use Email.");
            emailToUse = foundEmail;
        }

        const cred = await signInWithEmailAndPassword(auth, emailToUse, password);
        
        const user = getStoredUser(cred.user.uid);
        if(!user) {
            // Should not happen unless LS cleared but Firebase cookie exists
            const newUser = {
                id: cred.user.uid,
                username: cred.user.email?.split('@')[0] || 'User',
                email: cred.user.email || '',
                secretKeyAnswer: '',
                theme: 'dark' as any,
                points: 0
            };
            setStoredUser(newUser);
            return newUser;
        }
        
        return user;
    } catch (error: any) {
        console.error(error);
        throw new Error(error.message || "Invalid credentials");
    }
  }

  async logout(): Promise<void> {
      await signOut(auth);
  }

  // Improved Account Recovery Logic
  async recoverAccount(identifier: string): Promise<{ email: string; username?: string }> {
      const search = identifier.trim().toLowerCase();
      
      // 1. Scan LocalStorage for user profile to find match
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${STORAGE_PREFIX}user_`)) {
              try {
                  const u = JSON.parse(localStorage.getItem(key)!);
                  // Match Username or Email (case-insensitive)
                  if (u.username.toLowerCase() === search || u.email.toLowerCase() === search) {
                      return { email: u.email, username: u.username };
                  }
              } catch(e) {}
          }
      }

      // 2. If identifier looks like an email, assume it's valid and try to reset it directly via Firebase
      // This is necessary if the user is on a new device where LocalStorage is empty.
      if (search.includes('@')) {
          return { email: search };
      }

      throw new Error("Username not found on this device. Please use your Email Address.");
  }
  
  async resetPassword(email: string): Promise<void> {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
              throw new Error("No account found with this email.");
          }
          throw error;
      }
  }
  
  async updateUser(updatedUser: User): Promise<User> {
      const currentUser = auth.currentUser;
      if (currentUser && updatedUser.email !== currentUser.email) {
          await updateEmail(currentUser, updatedUser.email);
      }
      setStoredUser(updatedUser);
      return updatedUser;
  }

  async resetData(userId: string, secretKeyAnswer: string): Promise<boolean> {
     const user = getStoredUser(userId);
     if (!user || user.secretKeyAnswer !== secretKeyAnswer) {
         throw new Error("Invalid Secret Answer");
     }
     
     localStorage.removeItem(`${STORAGE_PREFIX}data_${userId}`);
     
     // Reset points
     user.points = 0;
     setStoredUser(user);
     return true;
  }

  // --- Data Access ---

  async getData(userId: string): Promise<AppData> {
    return getStoredData(userId);
  }

  // --- Generic CRUD ---

  async addItem<T extends { id: string }>(userId: string, collectionName: keyof AppData, item: T): Promise<T> {
    const data = getStoredData(userId);
    // @ts-ignore
    data[collectionName].push(item);
    setStoredData(userId, data);
    return item;
  }

  async updateItem<T extends { id: string }>(userId: string, collectionName: keyof AppData, item: T): Promise<T> {
    const data = getStoredData(userId);
    // @ts-ignore
    const index = data[collectionName].findIndex(x => x.id === item.id);
    if (index !== -1) {
        // @ts-ignore
        data[collectionName][index] = item;
        setStoredData(userId, data);
    }
    return item;
  }

  async deleteItem(userId: string, collectionName: keyof AppData, itemId: string): Promise<void> {
    const data = getStoredData(userId);
    // @ts-ignore
    data[collectionName] = data[collectionName].filter(x => x.id !== itemId);
    setStoredData(userId, data);
  }
  
  async checkTaskCompletedToday(userId: string, taskId: string, date: string): Promise<boolean> {
      const data = getStoredData(userId);
      return data.logs.some(l => l.taskId === taskId && l.date === date && l.completed);
  }
  
  async importData(userId: string, jsonData: string): Promise<void> {
      const parsed = JSON.parse(jsonData);
      // Basic structure check
      if(!parsed.tasks || !parsed.logs) throw new Error("Invalid backup file");
      setStoredData(userId, parsed);
  }
}

export const backend = new MockBackendService();
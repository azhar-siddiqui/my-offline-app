import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  updateDoc,
} from "firebase/firestore";

const getEnv = (key: string): string => {
  // 1. Look for Expo variables on the global object safely
  if (typeof globalThis !== "undefined" && (globalThis as any).process?.env) {
    return (globalThis as any).process.env[`${key}`] || "";
  }
  // 2. Look for Vite variables on the meta object safely
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    return (import.meta as any).env[`${key}`] || "";
  }
  return "";
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("VITE_FIREBASE_MEASURMENT_ID"),
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore 13 with automatic local cache queues
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export interface TodoItem {
  id?: string;
  title: string;
  completed: boolean;
}

const todoCollection = collection(db, "todos");

export const TodoService = {
  async create(title: string): Promise<string> {
    const docRef = await addDoc(todoCollection, { title, completed: false });
    return docRef.id;
  },

  // READ (Real-time stream that updates instantly offline)
  subscribeToTodos(callback: (todos: TodoItem[]) => void) {
    return onSnapshot(
      todoCollection,
      (querySnapshot) => {
        const todos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TodoItem[];
        callback(todos);
      },
      (error) => {
        console.error("Snapshot error: ", error);
      },
    );
  },

  // UPDATE
  async toggleComplete(id: string, currentStatus: boolean): Promise<void> {
    await updateDoc(doc(db, "todos", id), { completed: !currentStatus });
  },

  async updateTitle(id: string, title: string): Promise<void> {
    const next = title.trim();
    if (!next) return;
    await updateDoc(doc(db, "todos", id), { title: next });
  },

  // DELETE
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "todos", id));
  },
};

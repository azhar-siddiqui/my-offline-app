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

const firebaseConfig = {
  apiKey: "AIzaSyB_w7k4t8yYeVwE1sQkIEnvrgfjYNsiqbo",
  authDomain: "lab-app-38353.firebaseapp.com",
  projectId: "lab-app-38353",
  storageBucket: "lab-app-38353.firebasestorage.app",
  messagingSenderId: "798041708871",
  appId: "1:798041708871:web:026f8ec6a8c983a7f15462",
  measurementId: "G-1NK66VZX4B",
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

  // DELETE
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "todos", id));
  },
};

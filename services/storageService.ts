
import { Evaluation, Category } from '../types.ts';

const DB_NAME = 'EvalGenLocalDB';
const DB_VERSION = 1;
const STORES = {
  EVALUATIONS: 'evaluations',
  CATEGORIES: 'categories'
};

class StorageService {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.EVALUATIONS)) {
          db.createObjectStore(STORES.EVALUATIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getEvaluations(): Promise<Evaluation[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.EVALUATIONS, 'readonly');
      const request = transaction.objectStore(STORES.EVALUATIONS).getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async saveEvaluation(evaluation: Evaluation): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.EVALUATIONS, 'readwrite');
      transaction.objectStore(STORES.EVALUATIONS).put(evaluation);
      transaction.oncomplete = () => resolve();
    });
  }

  async deleteEvaluation(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.EVALUATIONS, 'readwrite');
      transaction.objectStore(STORES.EVALUATIONS).delete(id);
      transaction.oncomplete = () => resolve();
    });
  }

  async getCategories(): Promise<Category[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.CATEGORIES, 'readonly');
      const request = transaction.objectStore(STORES.CATEGORIES).getAll();
      request.onsuccess = () => {
        const results = request.result;
        if (!results || results.length === 0) {
          const defaultCats = [
            { id: '1', name: 'Français', color: '#3b82f6' },
            { id: '2', name: 'Mathématiques', color: '#10b981' },
            { id: '3', name: 'Histoire-Géo', color: '#f59e0b' }
          ];
          Promise.all(defaultCats.map(c => this.saveCategory(c))).then(() => resolve(defaultCats));
        } else resolve(results);
      };
    });
  }

  async saveCategory(category: Category): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.CATEGORIES, 'readwrite');
      transaction.objectStore(STORES.CATEGORIES).put(category);
      transaction.oncomplete = () => resolve();
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.CATEGORIES, 'readwrite');
      transaction.objectStore(STORES.CATEGORIES).delete(id);
      transaction.oncomplete = () => resolve();
    });
  }
}

export const storageService = new StorageService();

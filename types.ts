
export interface Question {
  id: string;
  sectionTitle: string;
  points: number;
  content: string;
  answer: string;
}

export interface Evaluation {
  id: string;
  title: string;
  categoryId: string;
  createdAt: number;
  questions: Question[];
  comment?: string;
  totalPoints: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface BackupData {
  evaluations: Evaluation[];
  categories: Category[];
  exportDate: number;
  version: string;
}

export type AppView = 'dashboard' | 'editor' | 'categories' | 'preview' | 'backup';

// Stub file for build compatibility
// TODO: Implement actual task data types and functions

export interface Task {
  id: string;
  title: string;
  description?: string;
  desc?: string;
  status: string;
  boardId: string;
  tags?: string[];
  assignees?: string[];
  assign?: any[];
  priority?: string;
  image?: string;
  category?: string;
  pages?: number;
  messageCount?: number;
  link?: string;
  date?: string;
  time?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const sampleTasks: Task[] = [];

export async function getTasks(): Promise<Task[]> {
  return sampleTasks;
}

export async function getTaskById(id: string): Promise<Task | null> {
  return sampleTasks.find(task => task.id === id) || null;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  assignDate?: string;
  assign?: any[];
  priority?: string;
  createdAt: Date;
  updatedAt: Date;
}
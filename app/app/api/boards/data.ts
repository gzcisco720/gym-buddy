// Stub file for build compatibility
// TODO: Implement actual board data types and functions

export interface Board {
  id: string;
  name: string;
  status: string;
  description?: string;
  tasks?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const sampleBoards: Board[] = [];

export async function getBoards(): Promise<Board[]> {
  return sampleBoards;
}

export async function getBoardById(id: string): Promise<Board | null> {
  return sampleBoards.find(board => board.id === id) || null;
}
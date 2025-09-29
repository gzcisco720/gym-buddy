// Stub file for build compatibility
// TODO: Implement actual comment data types and functions

export interface Comment {
  id: string;
  content: string;
  text?: string;
  taskId: string;
  subTaskId?: string;
  authorId: string;
  authorName: string;
  name?: string;
  avatar?: string;
  date?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const sampleComments: Comment[] = [];

export async function getComments(): Promise<Comment[]> {
  return sampleComments;
}

export async function getCommentById(id: string): Promise<Comment | null> {
  return sampleComments.find(comment => comment.id === id) || null;
}
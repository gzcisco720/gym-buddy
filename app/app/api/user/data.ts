// Stub file for build compatibility
// TODO: Implement actual user data types and functions

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const user: User[] = [];

export async function getUsers(): Promise<User[]> {
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return user.find(u => u.id === id) || null;
}

export type UserRole = 'student' | 'admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  lastLogin: string;
  program?: string;
  isBlocked?: boolean;
}

export interface Document {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  storagePath: string;
  uploaderId: string;
  uploaderName: string;
  uploadTimestamp: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  downloadCount?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  email: string;
  action: string;
  timestamp: string;
  ip: string;
  details: string;
  documentId?: string;
}

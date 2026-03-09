
export type UserRole = 'student' | 'admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  lastLogin: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploaderId: string;
  uploaderName: string;
  timestamp: string;
  permissions: 'public' | 'private' | 'faculty-only';
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuditLog {
  id: string;
  userId: string;
  email: string;
  action: string;
  timestamp: string;
  ip: string;
  details: string;
}

// User management API types
export interface UserResponse {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  managerId?: string;
  isActive: boolean;
  isBanned: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';
  firstName?: string;
  lastName?: string;
  phone?: string;
  managerId?: string;
}

export interface UpdateUserPayload {
  email?: string;
  role?: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';
  firstName?: string;
  lastName?: string;
  phone?: string;
  managerId?: string;
}

export interface UpdatePermissionsPayload {
  atoms: string[];
}

// Audit log API types
export interface AuditActor {
  id: string;
  email: string;
  role: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  targetId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  actor: AuditActor;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

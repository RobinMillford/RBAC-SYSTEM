export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  managerId: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

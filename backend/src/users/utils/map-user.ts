import { UserResponse } from '../interfaces/user-response.interface';

/** Minimal shape needed from Prisma result to build a UserResponse */
export type UserWithPerms = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: { atom: string }[];
};

export function mapUser(user: UserWithPerms): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    isBanned: user.isBanned,
    managerId: user.managerId,
    permissions: user.permissions.map((p) => p.atom),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

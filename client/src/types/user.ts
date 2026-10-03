export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserProfileDto {
  name?: string;
  email?: string;
}

export interface UpdateUserPasswordDto {
  currentPassword: string;
  newPassword: string;
}

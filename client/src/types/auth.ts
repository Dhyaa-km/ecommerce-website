import { User } from './user';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface ApiErrorResponse {
  message: string;
}

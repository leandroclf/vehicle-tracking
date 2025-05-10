export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  phone?: string;
}

export interface TokenPayload {
  id: string;
  role?: string;
  type: 'access' | 'refresh';
  [key: string]: any;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: Omit<User, 'password'>;
} 
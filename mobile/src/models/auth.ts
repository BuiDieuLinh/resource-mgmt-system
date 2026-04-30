/**
 * Authentication Models
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  department_id?: string;
  position_id?: string;
  employee_code?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  isLoading: boolean;
  isLoggedIn: boolean;
  user: User | null;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

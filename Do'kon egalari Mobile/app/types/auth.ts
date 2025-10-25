export interface Admin {
  _id?: string;
  id?: string;
  name: string;
  username: string;
  shopName: string;
  phone: string;
}

export interface AuthState {
  token: string | null;
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  api: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
  userId?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: Admin;
} 
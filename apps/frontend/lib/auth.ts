import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  user_id: number;
  role: string;
  email: string;
  business_id: number;
  exp: number;
}

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("token", token);
};

export const clearToken = (): void => {
  localStorage.removeItem("token");
  if (typeof document !== "undefined") document.cookie = "token=; path=/; max-age=0";
};

export const getUser = (): TokenPayload | null => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const user = getUser();
  if (!user) return false;
  return user.exp * 1000 > Date.now();
};

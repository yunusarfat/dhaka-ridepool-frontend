import Cookies from "js-cookie";

export type Role = "PASSENGER" | "DRIVER";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export function saveAuth(token: string, user: AuthUser) {
  Cookies.set("token", token, { expires: 7 });
  Cookies.set("user", JSON.stringify(user), { expires: 7 });
}

export function getToken(): string | undefined {
  return Cookies.get("token");
}

export function getUser(): AuthUser | null {
  const raw = Cookies.get("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  Cookies.remove("token");
  Cookies.remove("user");
}
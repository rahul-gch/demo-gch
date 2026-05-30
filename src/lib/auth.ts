export type AuthRole = "rahul" | "george" | "maria" | "admin";

export type DemoAccount = {
  username: string;
  password: string;
  role: AuthRole;
  name: string;
  roleLabel: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: "admin", password: "admin", role: "admin", name: "GCH Admin", roleLabel: "Platform Operator" },
  { username: "rahul", password: "rahul123", role: "rahul", name: "Rahul", roleLabel: "Brand Lead" },
  { username: "george", password: "george123", role: "george", name: "George", roleLabel: "Supplier Ops" },
  { username: "maria", password: "maria123", role: "maria", name: "Maria", roleLabel: "Evidence Reviewer" },
];

const STORAGE_KEY = "gch_demo_auth";

export function getCurrentUser(): DemoAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const role = raw as AuthRole;
    return DEMO_ACCOUNTS.find((a) => a.role === role) ?? null;
  } catch {
    return null;
  }
}

export function signIn(username: string, password: string): DemoAccount | null {
  const match = DEMO_ACCOUNTS.find(
    (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password,
  );
  if (!match) return null;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, match.role);
  }
  return match;
}

export function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

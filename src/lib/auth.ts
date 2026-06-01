import { supabase } from "@/integrations/supabase/client";

export type AuthRole = "rahul" | "george" | "maria" | "admin";

export type DemoAccount = {
  username: string;
  password: string;
  email: string;
  role: AuthRole;
  name: string;
  roleLabel: string;
  orgSlug: string | null;
};

// Deterministic emails/passwords so the demo always maps to the same Supabase auth users.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: "admin",  password: "GchDemo!Admin2025",  email: "admin@gch.local",    role: "admin",  name: "GCH Admin", roleLabel: "Platform Operator",  orgSlug: null },
  { username: "rahul",  password: "GchDemo!Rahul2025",  email: "rahul@gch.local",    role: "rahul",  name: "Rahul",     roleLabel: "Brand Lead",         orgSlug: "acme" },
  { username: "george", password: "GchDemo!George2025", email: "george@gch.local",   role: "george", name: "George",    roleLabel: "Supplier Ops",       orgSlug: "northwind" },
  { username: "maria",  password: "GchDemo!Maria2025",  email: "maria@gch.local",    role: "maria",  name: "Maria",     roleLabel: "Evidence Reviewer",  orgSlug: "starkv" },
];

const STORAGE_KEY = "gch_demo_auth";

export function getCurrentUser(): DemoAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return DEMO_ACCOUNTS.find((a) => a.role === (raw as AuthRole)) ?? null;
  } catch {
    return null;
  }
}

export async function signIn(username: string, password: string): Promise<DemoAccount | null> {
  const match = DEMO_ACCOUNTS.find(
    (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password,
  );
  if (!match) return null;

  // Bridge to real Supabase auth. Try sign-in; if user doesn't exist, sign up first.
  let { error } = await supabase.auth.signInWithPassword({ email: match.email, password: match.password });
  if (error) {
    const { error: signUpErr } = await supabase.auth.signUp({
      email: match.email,
      password: match.password,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (signUpErr && !/registered/i.test(signUpErr.message)) {
      console.error("[auth] signup failed", signUpErr);
      return null;
    }
    const retry = await supabase.auth.signInWithPassword({ email: match.email, password: match.password });
    if (retry.error) {
      console.error("[auth] signin failed after signup", retry.error);
      return null;
    }
  }

  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, match.role);
  return match;
}

export async function signOut() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  await supabase.auth.signOut().catch(() => {});
}

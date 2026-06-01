import { supabase } from "@/integrations/supabase/client";

// Internal "workspace type" — derived from the user's org type (brand/supplier/verifier)
// or the user_roles table (admin). Kept as a stable enum so existing UI keeps working.
export type AuthRole = "rahul" | "george" | "maria" | "admin";

export type SessionUser = {
  id: string;            // supabase auth user id
  email: string;
  name: string;
  role: AuthRole;        // workspace type
  roleLabel: string;
  orgSlug: string | null;
};

const SESSION_KEY = "gch_session_v2";

export function getCurrentUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function roleLabelFor(role: AuthRole): string {
  switch (role) {
    case "rahul": return "Brand Workspace";
    case "george": return "Supplier Workspace";
    case "maria": return "Verifier Workspace";
    case "admin": return "Platform Admin";
  }
}

export function roleForOrgType(type: "brand" | "supplier" | "verifier" | "regulator"): AuthRole {
  if (type === "brand") return "rahul";
  if (type === "supplier") return "george";
  return "maria"; // verifier & regulator share the reviewer workspace
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirect,
      data: { display_name: displayName },
    },
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirect },
  });
}

export async function signOut() {
  setCurrentUser(null);
  await supabase.auth.signOut().catch(() => {});
}

import { ALL_ENTITIES } from "@/seed/all-entities";

export type Severity = "critical" | "warning" | "info" | "success";

export interface PriorityItem {
  id: string;
  tone: Severity;
  label: string;
  count: number;
  to: string;
  search?: Record<string, string>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: "plus" | "userplus" | "building" | "handshake" | "message" | "megaphone";
  to: string;
  search?: Record<string, string>;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "add-org",
    label: "Add organization",
    icon: "plus",
    to: "/admin/organizations",
    search: { tab: "add" },
  },
  {
    id: "invite",
    label: "Onboarding links",
    icon: "userplus",
    to: "/admin/organizations",
    search: { tab: "invites" },
  },
  { id: "orgs", label: "Organizations", icon: "building", to: "/organizations" },
  { id: "match", label: "Matchmaking", icon: "handshake", to: "/matchmaking" },
  { id: "messages", label: "Messages", icon: "message", to: "/messages" },
  {
    id: "feed",
    label: "Community feed",
    icon: "megaphone",
    to: "/feed",
    search: { tab: "community" },
  },
];

export interface CountryRow {
  country: string;
  count: number;
}

export function topCountries(limit = 8): CountryRow[] {
  const map = new Map<string, number>();
  for (const e of ALL_ENTITIES) map.set(e.country, (map.get(e.country) || 0) + 1);
  return Array.from(map, ([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

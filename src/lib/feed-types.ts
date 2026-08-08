// Types for the community feed. Posts are created by users only — no seeded
// or generated content.
export type FeedKind =
  | "update"
  | "regulation"
  | "investment"
  | "partnership"
  | "event"
  | "ai-news"
  | "photo"
  | "video"
  | "document";

export interface FeedMedia {
  type: "photo" | "video" | "document";
  label: string;
  url?: string; // http(s) URL or data: URL
  mime?: string;
  sizeBytes?: number;
}

export interface FeedComment {
  id: string;
  author: string;
  role: string;
  body: string;
  at: string; // ISO
}

export interface FeedPost {
  id: string;
  orgId: string;
  authorName: string;
  authorRole: string;
  authorOrg: string;
  kind: FeedKind;
  title?: string;
  body: string;
  at: string; // ISO
  media?: FeedMedia[];
  likes: number;
  likedByMe?: boolean;
  comments: FeedComment[];
  rsvpCount?: number;
  rsvpByMe?: boolean;
  eventAt?: string; // ISO for event kind
}

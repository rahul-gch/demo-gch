import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  Calendar,
  Handshake,
  Landmark,
  Megaphone,
  ScrollText,
  Rss,
  FolderKanban,
  Send,
} from "lucide-react";
import type { Entity } from "@/seed/types";
import type { FeedKind, FeedPost } from "@/seed/feed";
import { useFeed, addPost, toggleLike, toggleRsvp, addComment } from "@/lib/use-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const KIND_META: Record<
  FeedKind,
  { label: string; icon: typeof Rss; className: string }
> = {
  update: { label: "Update", icon: Megaphone, className: "border-sky-200 bg-sky-50 text-sky-700" },
  regulation: { label: "Regulation", icon: ScrollText, className: "border-amber-200 bg-amber-50 text-amber-800" },
  investment: { label: "Investment", icon: Landmark, className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  partnership: { label: "Partnership", icon: Handshake, className: "border-violet-200 bg-violet-50 text-violet-700" },
  event: { label: "Event", icon: Calendar, className: "border-rose-200 bg-rose-50 text-rose-700" },
  "ai-news": { label: "AI news", icon: Sparkles, className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  photo: { label: "Photo", icon: ImageIcon, className: "border-slate-200 bg-slate-50 text-slate-700" },
  video: { label: "Video", icon: Video, className: "border-slate-200 bg-slate-50 text-slate-700" },
  document: { label: "Document", icon: FileText, className: "border-slate-200 bg-slate-50 text-slate-700" },
};

const FILTERS: { value: "all" | FeedKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "update", label: "Updates" },
  { value: "regulation", label: "Regulations" },
  { value: "investment", label: "Investments" },
  { value: "partnership", label: "Partnerships" },
  { value: "event", label: "Events" },
  { value: "ai-news", label: "AI News" },
];

type ComposerMode = "post" | "project" | "event";

export function FeedWorkspace({ entity }: { entity: Entity }) {
  const posts = useFeed(entity);
  const [filter, setFilter] = useState<"all" | FeedKind>("all");

  const filtered = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.kind === filter)),
    [posts, filter],
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Community feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sustainability-only network for {entity.name}. Share updates, run events, follow regulations.
          </p>
        </header>

        <Composer entity={entity} />

        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | FeedKind)}>
          <TabsList className="flex-wrap">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No posts in this filter yet.
              </CardContent>
            </Card>
          ) : (
            filtered.map((p) => <PostCard key={p.id} entity={entity} post={p} />)
          )}
        </div>
      </div>

      <QuickActions entity={entity} />
    </div>
  );
}

function Composer({ entity }: { entity: Entity }) {
  const [mode, setMode] = useState<ComposerMode>("post");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [media, setMedia] = useState<{ type: "photo" | "video" | "document"; label: string }[]>([]);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed && !title.trim()) {
      toast.error("Write something first.");
      return;
    }
    let kind: FeedKind = "update";
    if (mode === "project") kind = "partnership";
    if (mode === "event") kind = "event";
    if (media[0]?.type === "photo") kind = "photo";
    if (media[0]?.type === "video") kind = "video";
    if (media[0]?.type === "document") kind = "document";

    addPost(entity, {
      kind,
      title: title.trim() || undefined,
      body: trimmed || title.trim(),
      media: media.length ? media : undefined,
      eventAt: mode === "event" && eventAt ? new Date(eventAt).toISOString() : undefined,
    });
    setBody("");
    setTitle("");
    setEventAt("");
    setMedia([]);
    toast.success(mode === "event" ? "Event created" : mode === "project" ? "Project posted" : "Posted to feed");
  };

  const attach = (type: "photo" | "video" | "document") => {
    const label = type === "photo" ? "image.jpg" : type === "video" ? "clip.mp4" : "brief.pdf";
    setMedia((m) => [...m, { type, label }]);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as ComposerMode)}>
          <TabsList>
            <TabsTrigger value="post">Post</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="event">Event</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-3">
        {mode !== "post" && (
          <Input
            placeholder={mode === "event" ? "Event title" : "Project title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}
        {mode === "event" && (
          <Input type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
        )}
        <Textarea
          rows={3}
          placeholder={
            mode === "event"
              ? "Agenda, who should attend, format…"
              : mode === "project"
                ? "Scope, partners you're looking for, timeline…"
                : `Share an update from ${entity.name}…`
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {media.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {media.map((m, i) => (
              <Badge key={i} variant="outline" className="gap-1">
                {m.type === "photo" ? <ImageIcon className="h-3 w-3" /> : m.type === "video" ? <Video className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                {m.label}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => attach("photo")}>
              <ImageIcon className="h-4 w-4" /> Photo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => attach("video")}>
              <Video className="h-4 w-4" /> Video
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => attach("document")}>
              <FileText className="h-4 w-4" /> Document
            </Button>
          </div>
          <Button onClick={submit}>
            <Send className="h-4 w-4" />
            {mode === "event" ? "Publish event" : mode === "project" ? "Post project" : "Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({ entity, post }: { entity: Entity; post: FeedPost }) {
  const meta = KIND_META[post.kind];
  const Icon = meta.icon;
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const initials = post.authorName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const share = () => {
    try {
      navigator.clipboard?.writeText(`${window.location.origin}/organizations/${entity.id}/feed#${post.id}`);
      toast.success("Link copied");
    } catch {
      toast.success("Shared");
    }
  };

  return (
    <Card id={post.id} className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{post.authorName}</div>
              <div className="text-xs text-muted-foreground">
                {post.authorRole} · {post.authorOrg} · {timeAgo(post.at)}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={meta.className}>
            <Icon className="mr-1 h-3 w-3" />
            {meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.title && <CardTitle className="text-base font-semibold">{post.title}</CardTitle>}
        <p className="whitespace-pre-wrap text-sm text-slate-700">{post.body}</p>

        {post.media && post.media.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.media.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-700"
              >
                {m.type === "photo" ? (
                  <ImageIcon className="h-3.5 w-3.5" />
                ) : m.type === "video" ? (
                  <Video className="h-3.5 w-3.5" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                {m.label}
              </div>
            ))}
          </div>
        )}

        {post.kind === "event" && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-rose-50/50 px-3 py-2 text-xs text-rose-800">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.eventAt ? new Date(post.eventAt).toLocaleString() : "Date TBA"}
            </span>
            <div className="flex items-center gap-2">
              <span>{post.rsvpCount ?? 0} attending</span>
              <Button
                size="sm"
                variant={post.rsvpByMe ? "default" : "outline"}
                onClick={() => toggleRsvp(entity, post.id)}
              >
                {post.rsvpByMe ? "Going" : "RSVP"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 border-t pt-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => toggleLike(entity, post.id)}>
            <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-rose-500 text-rose-500" : ""}`} />
            {post.likes}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments((s) => !s)}>
            <MessageCircle className="h-4 w-4" />
            {post.comments.length}
          </Button>
          <Button variant="ghost" size="sm" onClick={share}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {showComments && (
          <div className="space-y-3 border-t pt-3">
            {post.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-sm">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">
                    {c.author.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-slate-700">{c.author}</span> · {c.role}
                  </div>
                  <div className="text-sm text-slate-700">{c.body}</div>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a comment…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    addComment(entity, post.id, draft.trim());
                    setDraft("");
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!draft.trim()) return;
                  addComment(entity, post.id, draft.trim());
                  setDraft("");
                }}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions({ entity }: { entity: Entity }) {
  const scrollToComposer = () => {
    const el = document.querySelector("textarea");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLTextAreaElement | null)?.focus();
  };
  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={scrollToComposer}>
            <FolderKanban className="h-4 w-4" /> Create project
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={scrollToComposer}>
            <Calendar className="h-4 w-4" /> Create event
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={scrollToComposer}>
            <ImageIcon className="h-4 w-4" /> Upload media
          </Button>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">About this feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>Only sustainability posts from your GCH network. No noise.</p>
          <p className="inline-flex items-center gap-1"><Rss className="h-3 w-3" /> Curated for {entity.name}</p>
        </CardContent>
      </Card>
    </aside>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

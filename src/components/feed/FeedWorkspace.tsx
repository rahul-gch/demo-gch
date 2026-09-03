import { useMemo, useRef, useState } from "react";
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
  Download,
  X,
  Play,
} from "lucide-react";
import type { Entity } from "@/seed/types";
import type { FeedKind, FeedMedia, FeedPost } from "@/lib/feed-types";
import { useFeed, useFeedActions } from "@/lib/use-feed";
import { PostMenu } from "@/components/feed/PostMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const KIND_META: Record<FeedKind, { label: string; icon: typeof Rss; className: string }> = {
  update: { label: "Update", icon: Megaphone, className: "border-sky-200 bg-sky-50 text-sky-700" },
  regulation: {
    label: "Regulation",
    icon: ScrollText,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  investment: {
    label: "Investment",
    icon: Landmark,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  partnership: {
    label: "Partnership",
    icon: Handshake,
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  event: { label: "Event", icon: Calendar, className: "border-rose-200 bg-rose-50 text-rose-700" },
  "ai-news": {
    label: "AI news",
    icon: Sparkles,
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  photo: {
    label: "Photo",
    icon: ImageIcon,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  video: { label: "Video", icon: Video, className: "border-slate-200 bg-slate-50 text-slate-700" },
  document: {
    label: "Document",
    icon: FileText,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
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
  const { posts, isLoading } = useFeed(entity);
  const [filter, setFilter] = useState<"all" | FeedKind>("all");

  const filtered = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.kind === filter)),
    [posts, filter],
  );

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Community feed</h1>
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
                {isLoading ? "Loading feed…" : "No posts yet. Share the first update."}
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

const MAX_UPLOAD_BYTES = 1_500_000; // ~1.5MB — inlined into the post record

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function Composer({ entity }: { entity: Entity }) {
  const { addPost, posting } = useFeedActions(entity.orgUuid ?? null);
  const [mode, setMode] = useState<ComposerMode>("post");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [media, setMedia] = useState<FeedMedia[]>([]);

  const photoInput = useRef<HTMLInputElement | null>(null);
  const videoInput = useRef<HTMLInputElement | null>(null);
  const docInput = useRef<HTMLInputElement | null>(null);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed && !title.trim() && media.length === 0) {
      toast.error("Write something or attach a file.");
      return;
    }
    let kind: FeedKind = "update";
    if (mode === "project") kind = "partnership";
    if (mode === "event") kind = "event";
    if (mode === "post" && media[0]) kind = media[0].type;

    if (!entity.orgUuid) {
      toast.error("This organization is not available for posting.");
      return;
    }
    await addPost({
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
    toast.success(
      mode === "event" ? "Event created" : mode === "project" ? "Project posted" : "Posted to feed",
    );
  };

  const handleFiles = async (type: "photo" | "video" | "document", fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const additions: FeedMedia[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(
          `${file.name} is over ${(MAX_UPLOAD_BYTES / 1_000_000).toFixed(1)}MB — skipped.`,
        );
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        additions.push({
          type,
          label: file.name,
          url: dataUrl,
          mime: file.type,
          sizeBytes: file.size,
        });
      } catch {
        toast.error(`Could not read ${file.name}.`);
      }
    }
    if (additions.length) setMedia((m) => [...m, ...additions]);
  };

  const removeMedia = (idx: number) => setMedia((m) => m.filter((_, i) => i !== idx));

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
          <Input
            type="datetime-local"
            value={eventAt}
            onChange={(e) => setEventAt(e.target.value)}
          />
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
          <div className="grid gap-2 sm:grid-cols-2">
            {media.map((m, i) => (
              <div key={i} className="group relative overflow-hidden rounded-md border bg-slate-50">
                <MediaPreview media={m} compact />
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${m.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void handleFiles("photo", e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            void handleFiles("video", e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={docInput}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf"
          multiple
          hidden
          onChange={(e) => {
            void handleFiles("document", e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => photoInput.current?.click()}
            >
              <ImageIcon className="h-4 w-4" /> Photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => videoInput.current?.click()}
            >
              <Video className="h-4 w-4" /> Video
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => docInput.current?.click()}
            >
              <FileText className="h-4 w-4" /> Document
            </Button>
          </div>
          <Button onClick={() => void submit()} disabled={posting}>
            <Send className="h-4 w-4" />
            {mode === "event" ? "Publish event" : mode === "project" ? "Post project" : "Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MediaPreview({ media, compact }: { media: FeedMedia; compact?: boolean }) {
  if (media.type === "photo") {
    return media.url ? (
      <img
        src={media.url}
        alt={media.label}
        className={`w-full ${compact ? "h-32 object-cover" : "max-h-[420px] rounded-md object-cover"}`}
      />
    ) : (
      <MediaFallback media={media} />
    );
  }
  if (media.type === "video") {
    return media.url ? (
      <video
        src={media.url}
        controls
        preload="metadata"
        className={`w-full bg-black ${compact ? "h-32 object-cover" : "max-h-[420px] rounded-md"}`}
      />
    ) : (
      <MediaFallback media={media} icon={Play} />
    );
  }
  // document
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-slate-500" />
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-800">{media.label}</div>
          {media.sizeBytes ? (
            <div className="text-xs text-muted-foreground">
              {(media.sizeBytes / 1024).toFixed(0)} KB{media.mime ? ` · ${media.mime}` : ""}
            </div>
          ) : null}
        </div>
      </div>
      {media.url ? (
        <Button asChild variant="outline" size="sm">
          <a href={media.url} download={media.label} target="_blank" rel="noreferrer">
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </Button>
      ) : (
        <Badge variant="outline" className="text-xs">
          Preview only
        </Badge>
      )}
    </div>
  );
}

function MediaFallback({
  media,
  icon: Icon = ImageIcon,
}: {
  media: FeedMedia;
  icon?: typeof ImageIcon;
}) {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-1 bg-slate-100 text-xs text-slate-500">
      <Icon className="h-5 w-5" />
      <span className="truncate px-2">{media.label}</span>
    </div>
  );
}

function PostCard({ entity, post }: { entity: Entity; post: FeedPost }) {
  const { toggleLike, addComment, deletePost } = useFeedActions(entity.orgUuid ?? null);
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
      navigator.clipboard?.writeText(
        `${window.location.origin}/organizations/${entity.id}/feed#${post.id}`,
      );
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
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="outline" className={meta.className}>
              <Icon className="mr-1 h-3 w-3" />
              {meta.label}
            </Badge>
            <PostMenu canDelete={post.canDelete} onDelete={() => deletePost(post.id)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.title && <CardTitle className="text-base font-semibold">{post.title}</CardTitle>}
        <p className="whitespace-pre-wrap text-sm text-slate-700">{post.body}</p>

        {post.media && post.media.length > 0 && (
          <div className={post.media.length === 1 ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
            {post.media.map((m, i) => (
              <MediaPreview key={i} media={m} />
            ))}
          </div>
        )}

        {post.kind === "event" && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-rose-50/50 px-3 py-2 text-xs text-rose-800">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.eventAt ? new Date(post.eventAt).toLocaleString() : "Date TBA"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 border-t pt-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => toggleLike(post.id)}>
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
                    {c.author
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)}
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
                    void addComment({ postId: post.id, body: draft.trim() });
                    setDraft("");
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!draft.trim()) return;
                  void addComment({ postId: post.id, body: draft.trim() });
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

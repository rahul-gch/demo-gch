import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Smile, Send } from "lucide-react";

export function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t bg-background px-4 py-3 sm:px-5">
      <div className="min-w-0 rounded-2xl border bg-card px-3 py-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-ring">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder ?? "Write a message…"}
          className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 pt-1">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Attach">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-3">
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Enter</kbd> to send
            </span>
            <Button size="sm" onClick={onSend} disabled={!value.trim()} className="rounded-full">
              <Send className="mr-1 h-3.5 w-3.5" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

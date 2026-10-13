import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { validateVerificationFile } from "@/lib/verification";

export function VerificationUpload({
  file,
  onFile,
  later,
  onLater,
  showLater = true,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  later?: boolean;
  onLater?: (v: boolean) => void;
  showLater?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = validateVerificationFile(f);
    setError(err);
    if (!err) {
      onFile(f);
      onLater?.(false);
    }
  };

  return (
    <div className="space-y-3">
      {file ? (
        <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2.5">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
          <button
            type="button"
            aria-label="Remove file"
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            onClick={() => onFile(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={later}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-5 text-center transition-colors",
            drag ? "border-primary bg-primary/5" : "hover:bg-muted/50",
            later && "cursor-not-allowed opacity-50",
          )}
        >
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Upload business registration</span>
          <span className="text-xs text-muted-foreground">
            Trade licence or certificate of incorporation · PDF, JPG or PNG up to 10 MB
          </span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {showLater && onLater && (
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox
            checked={!!later}
            onCheckedChange={(v) => {
              onLater(v === true);
              if (v === true) onFile(null);
            }}
            className="mt-0.5"
          />
          <span>
            I'll upload this later
            <span className="block text-xs text-muted-foreground">
              Your workspace works right away. Verified organizations get a badge and rank higher in matchmaking.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}

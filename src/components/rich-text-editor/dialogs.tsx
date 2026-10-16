/** @format */

import { useEffect, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ImagePlus, Loader2, Lock, Unlock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { uploadEditorImage } from "@/lib/editor";
import { cn } from "@/lib/utils";
import type { MediaValues } from "./media";

const fieldLabel = "text-[11px] leading-6 tracking-wider uppercase text-ink-subtle";
const fieldInput = "h-10 rounded-lg text-[14px]";

interface ShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Puts focus back in the editor as soon as the dialog closes.
  onClosed: () => void;
  title: string;
  onSubmit: () => void;
  submitLabel?: string;
  wide?: boolean;
  extraAction?: ReactNode;
  children: ReactNode;
}

// Above the editor's fullscreen layer (z-[1200]).
function DialogShell({ open, onOpenChange, onClosed, title, onSubmit, submitLabel = "Save", wide, extraAction, children }: ShellProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1300] bg-navy/45" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            onClosed();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-[1300] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-modal",
            wide ? "max-w-3xl" : "max-w-md",
          )}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <DialogPrimitive.Title className="text-[16px] font-semibold text-navy">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Close className="text-ink-faint" aria-label="Close">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="px-6 py-4 space-y-4">{children}</div>
            <div className="px-6 pb-6 flex items-center gap-2">
              {extraAction}
              <DialogPrimitive.Close className="flex-1 h-10 rounded-lg text-sm font-medium bg-fill text-navy">
                Cancel
              </DialogPrimitive.Close>
              <button type="submit" className="flex-1 h-10 rounded-lg text-sm font-medium bg-gold-light text-navy">
                {submitLabel}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 rounded-lg p-1 bg-fill">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex-1 h-8 rounded-md text-[13px] font-medium",
            value === key ? "bg-white text-navy shadow-card" : "text-ink-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// --- Link ---------------------------------------------------------------

export interface LinkValues {
  href: string;
  text: string;
  title: string;
  newTab: boolean;
}

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  initial: LinkValues;
  // False when the selection spans more than plain text, as in TinyMCE.
  showText: boolean;
  isEditing: boolean;
  onSave: (values: LinkValues) => void;
  onRemove: () => void;
}

export function LinkDialog({ open, onOpenChange, onClosed, initial, showText, isEditing, onSave, onRemove }: LinkDialogProps) {
  const [values, setValues] = useState(initial);
  useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);
  const set = (patch: Partial<LinkValues>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      title={isEditing ? "Edit link" : "Insert link"}
      onSubmit={() => onSave(values)}
      extraAction={
        isEditing ? (
          <button type="button" onClick={onRemove} className="h-10 px-3 rounded-lg text-sm font-medium bg-danger-soft text-danger">
            Remove
          </button>
        ) : null
      }
    >
      <div className="space-y-1.5">
        <Label className={fieldLabel}>URL</Label>
        <Input autoFocus value={values.href} onChange={(e) => set({ href: e.target.value })} placeholder="https://" className={fieldInput} />
      </div>
      {showText && (
        <div className="space-y-1.5">
          <Label className={fieldLabel}>Text to display</Label>
          <Input value={values.text} onChange={(e) => set({ text: e.target.value })} className={fieldInput} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className={fieldLabel}>Title</Label>
        <Input value={values.title} onChange={(e) => set({ title: e.target.value })} className={fieldInput} />
      </div>
      <div className="space-y-1.5">
        <Label className={fieldLabel}>Open link in</Label>
        <select
          value={values.newTab ? "new" : "current"}
          onChange={(e) => set({ newTab: e.target.value === "new" })}
          className="w-full h-10 rounded-lg text-[14px] px-3 outline-hidden cursor-pointer bg-white border border-line text-navy"
        >
          <option value="current">Current window</option>
          <option value="new">New window</option>
        </select>
      </div>
    </DialogShell>
  );
}

// --- Image --------------------------------------------------------------

export interface ImageValues {
  src: string;
  alt: string;
  width: string;
  height: string;
  // Only for figure.image blocks, which carry a caption.
  caption: string | null;
}

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  initial: ImageValues;
  isEditing: boolean;
  onSave: (values: ImageValues) => void;
}

const naturalSize = (src: string) =>
  new Promise<{ width: number; height: number } | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });

export function ImageDialog({ open, onOpenChange, onClosed, initial, isEditing, onSave }: ImageDialogProps) {
  const { toast } = useToast();
  const [values, setValues] = useState(initial);
  const [tab, setTab] = useState<"general" | "upload">("general");
  const [locked, setLocked] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial);
      setTab("general");
    }
  }, [open, initial]);
  const set = (patch: Partial<ImageValues>) => setValues((v) => ({ ...v, ...patch }));

  // Like TinyMCE, fill in the dimensions when a new source has none.
  const fillDimensions = async (src: string) => {
    if (!src || values.width || values.height) return;
    const size = await naturalSize(src);
    if (size) set({ width: String(size.width), height: String(size.height) });
  };

  // Keep the aspect ratio while "constrain proportions" is on.
  const resize = (key: "width" | "height", value: string) => {
    const other = key === "width" ? "height" : "width";
    const from = Number(values[key]), to = Number(values[other]), next = Number(value);
    if (locked && from && to && next) set({ [key]: value, [other]: String(Math.round((to * next) / from)) });
    else set({ [key]: value });
  };

  const upload = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const src = await uploadEditorImage(file);
      const size = await naturalSize(src);
      set({ src, ...(size && { width: String(size.width), height: String(size.height) }) });
      setTab("general");
    } catch (err) {
      toast({ title: "Image upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      title={isEditing ? "Edit image" : "Insert image"}
      onSubmit={() => values.src.trim() && onSave(values)}
    >
      <Tabs<"general" | "upload"> tabs={[["general", "General"], ["upload", "Upload"]]} value={tab} onChange={setTab} />

      {tab === "general" ? (
        <>
          <div className="space-y-1.5">
            <Label className={fieldLabel}>Source</Label>
            <Input
              autoFocus
              value={values.src}
              onChange={(e) => set({ src: e.target.value })}
              onBlur={(e) => fillDimensions(e.target.value.trim())}
              placeholder="https://"
              className={fieldInput}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldLabel}>Alternative description</Label>
            <Input value={values.alt} onChange={(e) => set({ alt: e.target.value })} className={fieldInput} />
          </div>
          {values.caption !== null && (
            <div className="space-y-1.5">
              <Label className={fieldLabel}>Caption</Label>
              <Input value={values.caption} onChange={(e) => set({ caption: e.target.value })} className={fieldInput} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className={fieldLabel}>Width × height</Label>
            <div className="flex items-center gap-2">
              <Input value={values.width} onChange={(e) => resize("width", e.target.value)} inputMode="numeric" className={fieldInput} />
              <span className="text-ink-faint">×</span>
              <Input value={values.height} onChange={(e) => resize("height", e.target.value)} inputMode="numeric" className={fieldInput} />
              <button
                type="button"
                onClick={() => setLocked(!locked)}
                title="Constrain proportions"
                className={cn("h-10 w-10 shrink-0 rounded-lg flex items-center justify-center", locked ? "bg-gold-soft text-gold-dark" : "bg-fill text-ink-subtle")}
              >
                {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <label
          className="flex flex-col items-center justify-center gap-1.5 w-full h-40 rounded-lg cursor-pointer bg-surface-muted border border-dashed border-line-strong"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files[0]);
          }}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-ink-faint" /> : <ImagePlus className="h-5 w-5 text-ink-faint" />}
          <span className="text-xs text-ink-faint">{uploading ? "Uploading..." : "Drop an image here or click to browse"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </DialogShell>
  );
}

// --- Media --------------------------------------------------------------

interface MediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  initial: MediaValues;
  isEditing: boolean;
  onSave: (values: MediaValues) => void;
  onSaveEmbed: (html: string) => void;
}

export function MediaDialog({ open, onOpenChange, onClosed, initial, isEditing, onSave, onSaveEmbed }: MediaDialogProps) {
  const [values, setValues] = useState(initial);
  const [embed, setEmbed] = useState("");
  const [tab, setTab] = useState<"general" | "embed">("general");

  useEffect(() => {
    if (open) {
      setValues(initial);
      setEmbed("");
      setTab("general");
    }
  }, [open, initial]);
  const set = (patch: Partial<MediaValues>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      title={isEditing ? "Edit media" : "Insert media"}
      onSubmit={() => {
        if (tab === "embed" && embed.trim()) onSaveEmbed(embed.trim());
        else if (values.source.trim()) onSave(values);
      }}
    >
      <Tabs<"general" | "embed"> tabs={[["general", "General"], ["embed", "Embed"]]} value={tab} onChange={setTab} />

      {tab === "general" ? (
        <>
          <div className="space-y-1.5">
            <Label className={fieldLabel}>Source</Label>
            <Input
              autoFocus
              value={values.source}
              onChange={(e) => set({ source: e.target.value })}
              placeholder="YouTube, Vimeo or video file URL"
              className={fieldInput}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldLabel}>Width × height</Label>
            <div className="flex items-center gap-2">
              <Input value={values.width} onChange={(e) => set({ width: e.target.value })} inputMode="numeric" className={fieldInput} />
              <span className="text-ink-faint">×</span>
              <Input value={values.height} onChange={(e) => set({ height: e.target.value })} inputMode="numeric" className={fieldInput} />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <Label className={fieldLabel}>Paste your embed code</Label>
          <textarea
            autoFocus
            value={embed}
            onChange={(e) => setEmbed(e.target.value)}
            rows={6}
            className="w-full rounded-lg text-[13px] font-mono px-3 py-2.5 outline-hidden resize-none bg-white border border-line text-navy"
          />
        </div>
      )}
    </DialogShell>
  );
}

// --- Source code ----------------------------------------------------------

interface SourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  html: string;
  onSave: (html: string) => void;
}

export function SourceDialog({ open, onOpenChange, onClosed, html, onSave }: SourceDialogProps) {
  const [value, setValue] = useState(html);
  useEffect(() => {
    if (open) setValue(html);
  }, [open, html]);

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} onClosed={onClosed} title="Source code" onSubmit={() => onSave(value)} wide>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        className="w-full h-[60vh] rounded-lg text-[13px] leading-relaxed font-mono px-3 py-2.5 outline-hidden resize-none bg-surface-muted border border-line text-navy"
      />
    </DialogShell>
  );
}

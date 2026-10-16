/** @format */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { getMarkRange } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ImageExtension from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { CharacterCount } from "@tiptap/extensions";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadEditorImage } from "@/lib/editor";
import { cn } from "@/lib/utils";
import { Audio, ContentAttributes, Div, Figure, Iframe, InsiderTip, Pre, PullQuote, Video } from "./extensions";
import { SearchReplace, getSearchState } from "./search-replace";
import { fromStoredHtml, toStoredHtml } from "./html";
import { mediaFromUrl, type MediaValues } from "./media";
import { ImageDialog, LinkDialog, MediaDialog, SourceDialog, type ImageValues, type LinkValues } from "./dialogs";
import { Toolbar } from "./toolbar";
import "./editor.css";

// The image types TinyMCE accepted for paste/drop uploads.
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"]);

const TAG: Record<string, string> = {
  paragraph: "p", bulletList: "ul", orderedList: "ol", listItem: "li", blockquote: "blockquote", insiderTip: "div",
  div: "div", codeBlock: "pre", table: "table", tableRow: "tr", tableCell: "td", tableHeader: "th", figure: "figure",
  image: "img", iframe: "iframe", video: "video", audio: "audio", horizontalRule: "hr",
  bold: "strong", italic: "em", underline: "u", strike: "s", superscript: "sup", subscript: "sub", code: "code", link: "a",
};
const tagOf = (node: PMNode) => (node.type.name === "heading" ? `h${node.attrs.level}` : (TAG[node.type.name] ?? node.type.name));

// Element path shown in the status bar, e.g. "p › strong".
const elementPath = (editor: Editor) => {
  const { selection } = editor.state;
  const { $from } = selection;
  const path: string[] = [];
  for (let depth = 1; depth <= $from.depth; depth++) path.push(tagOf($from.node(depth)));
  if (selection instanceof NodeSelection) path.push(tagOf(selection.node));
  else $from.marks().forEach((m) => path.push(TAG[m.type.name] ?? m.type.name));
  return path.join(" › ");
};

// One newline after each block, so the source view is readable.
const formatSource = (html: string) =>
  html.replace(/(<\/(p|h[1-6]|div|blockquote|ul|ol|li|table|thead|tbody|tr|pre|figure)>)/g, "$1\n").trim();

const normalizeUrl = (url: string) => {
  const value = url.trim();
  if (/^[^\s@/:]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^www\./i.test(value)) return `https://${value}`;
  return value;
};

const EMPTY_LINK: LinkValues = { href: "", text: "", title: "", newTab: false };
const EMPTY_IMAGE: ImageValues = { src: "", alt: "", width: "", height: "", caption: null };
const EMPTY_MEDIA: MediaValues = { source: "", width: "", height: "" };

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  height: number;
  // CSS aspect-ratio for images in the content, e.g. "16 / 9".
  imageAspectRatio: string;
}

export function RichTextEditor({ value, onChange, height, imageAspectRatio }: RichTextEditorProps) {
  const { toast } = useToast();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // The last HTML sent to or received from the parent, to tell our own
  // updates apart from new content (e.g. a record that finished loading).
  const lastHtml = useRef<string | null>(null);

  const [fullscreen, setFullscreen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [link, setLink] = useState<{ open: boolean; initial: LinkValues; range: { from: number; to: number }; showText: boolean; editing: boolean }>({
    open: false, initial: EMPTY_LINK, range: { from: 0, to: 0 }, showText: true, editing: false,
  });
  const [image, setImage] = useState<{ open: boolean; initial: ImageValues; editing: boolean }>({ open: false, initial: EMPTY_IMAGE, editing: false });
  const [media, setMedia] = useState<{ open: boolean; initial: MediaValues; editing: boolean }>({ open: false, initial: EMPTY_MEDIA, editing: false });
  const [source, setSource] = useState<{ open: boolean; html: string }>({ open: false, html: "" });

  // Files dropped/pasted are shown from a blob: URL until their upload finishes.
  const pendingFiles = useRef(new Map<string, File>());
  const uploading = useRef(new Set<string>());
  const editorRef = useRef<Editor | null>(null);
  const openLinkRef = useRef<() => void>(() => {});

  const insertFiles = (files: File[], pos?: number) => {
    const editor = editorRef.current;
    if (!editor || !files.length) return;
    const images = files.map((file) => {
      const src = URL.createObjectURL(file);
      pendingFiles.current.set(src, file);
      return { type: "image", attrs: { src } };
    });
    const chain = editor.chain().focus();
    (pos === undefined ? chain.insertContent(images) : chain.insertContentAt(pos, images)).run();
  };

  const replaceImageSrc = (editor: Editor, from: string, to: string | null) => {
    const { tr } = editor.state;
    editor.state.doc.descendants((node, pos) => {
      if (node.attrs.src !== from) return;
      if (to) tr.setNodeMarkup(tr.mapping.map(pos), undefined, { ...node.attrs, src: to });
      else tr.delete(tr.mapping.map(pos), tr.mapping.map(pos + node.nodeSize));
    });
    if (tr.docChanged) editor.view.dispatch(tr.setMeta("addToHistory", false));
  };

  // Uploads any blob:/data: images in the content, then swaps in the real
  // URL (TinyMCE's automatic_uploads). Failed uploads are removed.
  const uploadPendingImages = useCallback(
    (editor: Editor) => {
      editor.state.doc.descendants((node) => {
        const src = node.attrs.src;
        if (!["image", "figure"].includes(node.type.name) || typeof src !== "string" || !/^(blob|data):/.test(src)) return;
        if (uploading.current.has(src)) return;
        uploading.current.add(src);
        (async () => {
          try {
            const file =
              pendingFiles.current.get(src) ??
              (await fetch(src)
                .then((r) => r.blob())
                .then((b) => new File([b], `image.${b.type.split("/")[1] || "png"}`, { type: b.type })));
            const url = await uploadEditorImage(file);
            if (!editor.isDestroyed) replaceImageSrc(editor, src, url);
          } catch (err) {
            if (!editor.isDestroyed) replaceImageSrc(editor, src, null);
            toast({ title: "Image upload failed", description: (err as Error).message, variant: "destructive" });
          } finally {
            uploading.current.delete(src);
            if (pendingFiles.current.delete(src)) URL.revokeObjectURL(src);
          }
        })();
      });
    },
    [toast],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        trailingNode: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          // Only links set to open in a new window get a target, as before.
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      Pre,
      Div,
      InsiderTip,
      PullQuote,
      ContentAttributes,
      TextAlign.configure({ types: ["heading", "paragraph", "div"], alignments: ["left", "center", "right", "justify"] }),
      ImageExtension.configure({ inline: true, allowBase64: true }),
      Figure,
      Iframe,
      Video,
      Audio,
      Subscript,
      Superscript,
      TableKit.configure({ table: { resizable: false } }),
      CharacterCount,
      SearchReplace,
    ],
    content: "",
    editorProps: {
      // TinyMCE left the browser spellchecker off.
      attributes: { class: "rte-content", spellcheck: "false" },
      handlePaste: (_view, event) => {
        const data = event.clipboardData;
        const files = [...(data?.files ?? [])].filter((f) => IMAGE_TYPES.has(f.type));
        // Pasted HTML wins (it already points at the image online).
        if (!files.length || data?.types.includes("text/html")) return false;
        insertFiles(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = [...(event.dataTransfer?.files ?? [])].filter((f) => IMAGE_TYPES.has(f.type));
        if (moved || !files.length) return false;
        event.preventDefault();
        insertFiles(files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
        return true;
      },
      handleKeyDown: (_view, event) => {
        const mod = event.metaKey || event.ctrlKey;
        const editor = editorRef.current;
        if (!editor) return false;
        let handled = true;
        if (mod && !event.shiftKey && event.key.toLowerCase() === "k") openLinkRef.current();
        else if (mod && !event.shiftKey && event.key.toLowerCase() === "f") setFindOpen(true);
        else if (mod && event.shiftKey && event.key.toLowerCase() === "f") setFullscreen((f) => !f);
        // TinyMCE's Alt+Shift+1..6 headings, 7 paragraph, 8 div.
        else if (event.altKey && event.shiftKey && /^Digit[1-8]$/.test(event.code)) {
          const n = Number(event.code.slice(5));
          const chain = editor.chain().focus();
          if (n <= 6) chain.toggleHeading({ level: n as 1 | 2 | 3 | 4 | 5 | 6 }).run();
          else if (n === 7) chain.setParagraph().run();
          else chain.toggleDiv().run();
        } else handled = false;
        if (handled) event.preventDefault();
        return handled;
      },
    },
    onUpdate: ({ editor }) => {
      uploadPendingImages(editor);
      const html = editor.isEmpty ? "" : toStoredHtml(editor.getHTML());
      if (html === lastHtml.current) return;
      lastHtml.current = html;
      onChangeRef.current(html);
    },
  });
  editorRef.current = editor;

  // Load new content from the parent without adding it to the undo history.
  // Tracks the instance too: Tiptap may replace the first editor it creates.
  const loadedInto = useRef<Editor | null>(null);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === lastHtml.current && loadedInto.current === editor) return;
    lastHtml.current = value;
    loadedInto.current = editor;
    editor
      .chain()
      .command(({ tr }) => {
        tr.setMeta("addToHistory", false);
        return true;
      })
      .setContent(fromStoredHtml(value || ""), { emitUpdate: false })
      .run();
  }, [editor, value]);

  // Fullscreen covers the page; stop the page behind it from scrolling.
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  const openLink = () => {
    if (!editor) return;
    const { state } = editor;
    let { from, to } = state.selection;
    const editing = editor.isActive("link");
    if (editing) {
      const range = getMarkRange(state.doc.resolve(from), state.schema.marks.link);
      if (range && state.selection.empty) ({ from, to } = range);
    }
    let onlyText = true;
    state.doc.nodesBetween(from, to, (node) => {
      if (node.isInline && !node.isText) onlyText = false;
    });
    const attrs = editor.getAttributes("link");
    setLink({
      open: true,
      range: { from, to },
      showText: onlyText,
      editing,
      initial: { href: attrs.href ?? "", text: state.doc.textBetween(from, to, " "), title: attrs.title ?? "", newTab: attrs.target === "_blank" },
    });
  };
  openLinkRef.current = openLink;

  const saveLink = ({ href, text, title, newTab }: LinkValues) => {
    if (!editor) return;
    setLink((l) => ({ ...l, open: false }));
    const { from, to } = link.range;
    const url = normalizeUrl(href);
    const chain = editor.chain().focus().setTextSelection({ from, to });
    if (!url) {
      chain.extendMarkRange("link").unsetLink().run();
      return;
    }
    const attrs = { href: url, title: title || null, target: newTab ? "_blank" : null, rel: newTab ? "noopener" : null };
    const current = editor.state.doc.textBetween(from, to, " ");
    const label = text || current || url;
    if (link.showText && label !== current) {
      chain.insertContentAt({ from, to }, { type: "text", text: label, marks: [{ type: "link", attrs }] }).run();
    } else {
      // Leave the caret after the link, ready to keep typing.
      chain.setLink(attrs).setTextSelection(to).run();
    }
  };

  const removeLink = () => {
    if (!editor) return;
    setLink((l) => ({ ...l, open: false }));
    editor.chain().focus().setTextSelection(link.range).extendMarkRange("link").unsetLink().run();
  };

  const openImage = () => {
    if (!editor) return;
    const type = editor.isActive("figure") ? "figure" : editor.isActive("image") ? "image" : null;
    const a = type ? editor.getAttributes(type) : {};
    setImage({
      open: true,
      editing: !!type,
      initial: {
        src: a.src ?? "",
        alt: a.alt ?? "",
        width: a.width ? String(a.width) : "",
        height: a.height ? String(a.height) : "",
        caption: type === "figure" ? (a.caption ?? "") : null,
      },
    });
  };

  const saveImage = ({ src, alt, width, height, caption }: ImageValues) => {
    if (!editor) return;
    setImage((i) => ({ ...i, open: false }));
    const attrs = { src: src.trim(), alt: alt || null, width: width || null, height: height || null };
    const chain = editor.chain().focus();
    if (editor.isActive("figure")) chain.updateAttributes("figure", { ...attrs, caption: caption ?? "" }).run();
    else if (editor.isActive("image")) chain.updateAttributes("image", attrs).run();
    else chain.insertContent({ type: "image", attrs }).run();
  };

  const openMedia = () => {
    if (!editor) return;
    const type = ["iframe", "video", "audio"].find((t) => editor.isActive(t));
    const a = type ? editor.getAttributes(type) : {};
    setMedia({
      open: true,
      editing: !!type,
      initial: { source: a.src ?? "", width: a.width ? String(a.width) : "", height: a.height ? String(a.height) : "" },
    });
  };

  const saveMedia = (content: Parameters<Editor["commands"]["insertContent"]>[0]) => {
    if (!editor) return;
    setMedia((m) => ({ ...m, open: false }));
    // Replaces the selected media when editing.
    editor.chain().focus().insertContent(content).run();
  };

  const openSource = () => {
    if (!editor) return;
    setSource({ open: true, html: editor.isEmpty ? "" : formatSource(toStoredHtml(editor.getHTML())) });
  };

  const saveSource = (html: string) => {
    if (!editor) return;
    setSource((s) => ({ ...s, open: false }));
    editor.chain().focus().setContent(fromStoredHtml(html), { emitUpdate: true }).run();
  };

  const status = useEditorState({
    editor,
    selector: ({ editor: e }) => (e ? { path: elementPath(e), words: (e.storage.characterCount?.words?.() as number | undefined) ?? 0 } : null),
  });

  // Synchronous, so the very next keystroke lands in the editor.
  const refocus = () => {
    if (editor && !editor.isDestroyed) editor.view.focus();
  };

  const contentStyle = useMemo(() => ({ "--rte-image-aspect": imageAspectRatio }) as CSSProperties, [imageAspectRatio]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rich-text-editor flex flex-col bg-white",
        fullscreen ? "fixed inset-0 z-[1200]" : "resize-y overflow-hidden min-h-[200px]",
      )}
      style={fullscreen ? undefined : { height }}
    >
      <Toolbar
        editor={editor}
        fullscreen={fullscreen}
        onLink={openLink}
        onImage={openImage}
        onMedia={openMedia}
        onSource={openSource}
        onToggleFullscreen={() => setFullscreen((f) => !f)}
      />
      {findOpen && <FindReplaceBar editor={editor} onClose={() => setFindOpen(false)} />}
      <div className="flex-1 overflow-y-auto" style={contentStyle} onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} onClick={(e) => e.stopPropagation()} />
      </div>
      <div className="flex items-center justify-between gap-4 px-3 h-7 border-t border-line-soft text-[11.5px] text-ink-subtle">
        <span className="truncate font-mono">{status?.path}</span>
        <span className="shrink-0">
          {status?.words ?? 0} word{status?.words === 1 ? "" : "s"}
        </span>
      </div>

      <LinkDialog
        onClosed={refocus}
        open={link.open}
        onOpenChange={(open) => setLink((l) => ({ ...l, open }))}
        initial={link.initial}
        showText={link.showText}
        isEditing={link.editing}
        onSave={saveLink}
        onRemove={removeLink}
      />
      <ImageDialog
        onClosed={refocus}
        open={image.open}
        onOpenChange={(open) => setImage((i) => ({ ...i, open }))}
        initial={image.initial}
        isEditing={image.editing}
        onSave={saveImage}
      />
      <MediaDialog
        onClosed={refocus}
        open={media.open}
        onOpenChange={(open) => setMedia((m) => ({ ...m, open }))}
        initial={media.initial}
        isEditing={media.editing}
        onSave={(values) => saveMedia(mediaFromUrl(values))}
        onSaveEmbed={saveMedia}
      />
      <SourceDialog
        onClosed={refocus}
        open={source.open}
        onOpenChange={(open) => setSource((s) => ({ ...s, open }))}
        html={source.html}
        onSave={saveSource}
      />
    </div>
  );
}

function FindReplaceBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [term, setTerm] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const result = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const s = getSearchState(e.state);
      return { count: s.matches.length, current: s.current };
    },
  });

  useEffect(() => {
    editor.commands.setSearch({ term, caseSensitive, wholeWord });
  }, [editor, term, caseSensitive, wholeWord]);

  useEffect(() => () => void (editor.isDestroyed || editor.commands.clearSearch()), [editor]);

  const close = () => {
    onClose();
    editor.commands.focus();
  };

  const inputClass = "h-8 w-44 rounded-md px-2.5 text-[13px] outline-hidden bg-white border border-line text-navy";
  const buttonClass = "h-8 px-2.5 rounded-md text-[12.5px] font-medium text-navy hover:bg-fill disabled:opacity-40";
  const none = !result.count;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-line-soft bg-surface-muted"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <input
        autoFocus
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) editor.commands.findPrevious();
            else editor.commands.findNext();
          }
        }}
        placeholder="Find"
        className={inputClass}
      />
      <input value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="Replace with" className={inputClass} />
      <span className="w-16 text-[12px] text-ink-faint">{term ? (none ? "No results" : `${result.current + 1} of ${result.count}`) : ""}</span>
      <button type="button" title="Previous" onClick={() => editor.commands.findPrevious()} disabled={none} className={buttonClass}>
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" title="Next" onClick={() => editor.commands.findNext()} disabled={none} className={buttonClass}>
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => editor.commands.replaceMatch(replacement)} disabled={none} className={buttonClass}>
        Replace
      </button>
      <button type="button" onClick={() => editor.commands.replaceAllMatches(replacement)} disabled={none} className={buttonClass}>
        Replace all
      </button>
      <label className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="accent-gold" />
        Match case
      </label>
      <label className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} className="accent-gold" />
        Whole words
      </label>
      <button type="button" title="Close" onClick={close} className="ml-auto h-8 w-8 rounded-md flex items-center justify-center text-ink-faint hover:bg-fill">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** @format */

import type { ReactNode } from "react";
import { useEditorState, type Editor, type ChainedCommands } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  CodeXml,
  Film,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

interface FormatItem {
  label: string;
  isActive: (e: Editor) => boolean;
  run: (c: ChainedCommands, e: Editor) => ChainedCommands;
}

const align = (value: string): FormatItem => ({
  label: value[0].toUpperCase() + value.slice(1),
  isActive: (e) => e.isActive({ textAlign: value }),
  run: (c, e) => (e.isActive({ textAlign: value }) ? c.unsetTextAlign() : c.setTextAlign(value)),
});

// TinyMCE's default "Formats" menu, plus the site's two custom styles.
const FORMAT_GROUPS: [string, FormatItem[]][] = [
  [
    "Headings",
    ([1, 2, 3, 4, 5, 6] as const).map((level) => ({
      label: `Heading ${level}`,
      isActive: (e) => e.isActive("heading", { level }),
      run: (c) => c.toggleHeading({ level }),
    })),
  ],
  [
    "Inline",
    [
      { label: "Bold", isActive: (e) => e.isActive("bold"), run: (c) => c.toggleBold() },
      { label: "Italic", isActive: (e) => e.isActive("italic"), run: (c) => c.toggleItalic() },
      { label: "Underline", isActive: (e) => e.isActive("underline"), run: (c) => c.toggleUnderline() },
      { label: "Strikethrough", isActive: (e) => e.isActive("strike"), run: (c) => c.toggleStrike() },
      { label: "Superscript", isActive: (e) => e.isActive("superscript"), run: (c) => c.toggleSuperscript() },
      { label: "Subscript", isActive: (e) => e.isActive("subscript"), run: (c) => c.toggleSubscript() },
      { label: "Code", isActive: (e) => e.isActive("code"), run: (c) => c.toggleCode() },
    ],
  ],
  [
    "Blocks",
    [
      { label: "Paragraph", isActive: (e) => e.isActive("paragraph"), run: (c) => c.setParagraph() },
      { label: "Blockquote", isActive: (e) => e.isActive("blockquote"), run: (c) => c.toggleBlockquote() },
      { label: "Div", isActive: (e) => e.isActive("div"), run: (c) => c.toggleDiv() },
      { label: "Pre", isActive: (e) => e.isActive("codeBlock"), run: (c) => c.toggleCodeBlock() },
    ],
  ],
  ["Align", ["left", "center", "right", "justify"].map(align)],
  [
    "Styles",
    [
      { label: "Insider Tip", isActive: (e) => e.isActive("insiderTip"), run: (c) => c.toggleInsiderTip() },
      { label: "Pull Quote", isActive: (e) => e.isActive("blockquote", { class: "pull-quote" }), run: (c) => c.togglePullQuote() },
    ],
  ],
];

const BULLET_STYLES = ["default", "disc", "circle", "square"];
const NUMBER_STYLES = ["default", "lower-alpha", "lower-greek", "lower-roman", "upper-alpha", "upper-roman"];
const styleLabel = (s: string) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

const blockName = (e: Editor) => {
  for (const level of [1, 2, 3, 4, 5, 6]) if (e.isActive("heading", { level })) return `Heading ${level}`;
  if (e.isActive("codeBlock")) return "Pre";
  if (e.isActive("div")) return "Div";
  if (e.isActive("paragraph")) return "Paragraph";
  return "Formats";
};

function ToolButton({
  title,
  onClick,
  active,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor's selection when the button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-8 min-w-8 px-1.5 rounded-md flex items-center justify-center text-navy transition-colors hover:bg-fill disabled:opacity-40 disabled:hover:bg-transparent",
        active && "bg-gold-soft text-gold-dark hover:bg-gold-soft",
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-line-soft" />;

function Menu({ editor, trigger, title, children }: { editor: Editor; trigger: ReactNode; title: string; children: ReactNode }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={title}
          aria-label={title}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 px-1 rounded-md flex items-center justify-center gap-1 text-navy transition-colors hover:bg-fill data-[state=open]:bg-fill"
        >
          {trigger}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="z-[1250] max-h-[60vh] overflow-y-auto"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.commands.focus();
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuItem({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="gap-2 pr-6 text-navy">
      <Check className={cn("h-3.5 w-3.5", !active && "invisible")} />
      {label}
    </DropdownMenuItem>
  );
}

interface ToolbarProps {
  editor: Editor;
  fullscreen: boolean;
  onLink: () => void;
  onImage: () => void;
  onMedia: () => void;
  onSource: () => void;
  onToggleFullscreen: () => void;
}

export function Toolbar({ editor, fullscreen, onLink, onImage, onMedia, onSource, onToggleFullscreen }: ToolbarProps) {
  // Re-render on every selection/content change so active states stay current.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      block: blockName(e),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      align: ["left", "center", "right"].find((a) => e.isActive({ textAlign: a })),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      listStyle: (e.getAttributes(e.isActive("orderedList") ? "orderedList" : "bulletList").listStyleType as string) ?? "default",
      canOutdent: e.can().outdent(),
      link: e.isActive("link"),
      image: e.isActive("image") || e.isActive("figure"),
      media: e.isActive("iframe") || e.isActive("video") || e.isActive("audio"),
      blockquote: e.isActive("blockquote"),
      inTable: e.isActive("table"),
      // Recomputes the menu's active marks while it's open.
      selection: e.state.selection.toJSON(),
    }),
  });

  const run = (fn: (c: ChainedCommands) => ChainedCommands) => fn(editor.chain().focus()).run();
  const alignTo = (value: string) => run((c) => (s.align === value ? c.unsetTextAlign() : c.setTextAlign(value)));

  return (
    <div className="border-b border-line-soft bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <ToolButton title={`Undo (${MOD}Z)`} onClick={() => run((c) => c.undo())} disabled={!s.canUndo}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton title={`Redo (${MOD}Y)`} onClick={() => run((c) => c.redo())} disabled={!s.canRedo}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <Menu
          editor={editor}
          title="Formats"
          trigger={
            <span className="flex w-32 items-center justify-between px-1.5 text-[13.5px]">
              {s.block}
              <ChevronDown className="h-3.5 w-3.5 text-ink-subtle" />
            </span>
          }
        >
          {FORMAT_GROUPS.map(([group, items], i) => (
            <div key={group}>
              {i > 0 && <DropdownMenuSeparator />}
              <p className="px-2 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">{group}</p>
              {items.map((item) => (
                <MenuItem
                  key={item.label}
                  label={item.label}
                  active={item.isActive(editor)}
                  onSelect={() => item.run(editor.chain().focus(), editor).run()}
                />
              ))}
            </div>
          ))}
        </Menu>
        <Divider />

        <ToolButton title={`Bold (${MOD}B)`} onClick={() => run((c) => c.toggleBold())} active={s.bold}>
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton title={`Italic (${MOD}I)`} onClick={() => run((c) => c.toggleItalic())} active={s.italic}>
          <Italic className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton title="Align left" onClick={() => alignTo("left")} active={s.align === "left"}>
          <AlignLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Align center" onClick={() => alignTo("center")} active={s.align === "center"}>
          <AlignCenter className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Align right" onClick={() => alignTo("right")} active={s.align === "right"}>
          <AlignRight className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton title="Bullet list" onClick={() => run((c) => c.toggleBulletList())} active={s.bulletList}>
          <List className="h-4 w-4" />
        </ToolButton>
        <Menu editor={editor} title="Bullet list styles" trigger={<ChevronDown className="h-3.5 w-3.5 text-ink-subtle" />}>
          {BULLET_STYLES.map((style) => (
            <MenuItem
              key={style}
              label={styleLabel(style)}
              active={s.bulletList && s.listStyle === style}
              onSelect={() => editor.chain().focus().setListStyle("bulletList", style).run()}
            />
          ))}
        </Menu>
        <ToolButton title="Numbered list" onClick={() => run((c) => c.toggleOrderedList())} active={s.orderedList}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <Menu editor={editor} title="Numbered list styles" trigger={<ChevronDown className="h-3.5 w-3.5 text-ink-subtle" />}>
          {NUMBER_STYLES.map((style) => (
            <MenuItem
              key={style}
              label={styleLabel(style)}
              active={s.orderedList && s.listStyle === style}
              onSelect={() => editor.chain().focus().setListStyle("orderedList", style).run()}
            />
          ))}
        </Menu>
        <ToolButton title="Decrease indent" onClick={() => run((c) => c.outdent())} disabled={!s.canOutdent}>
          <IndentDecrease className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Increase indent" onClick={() => run((c) => c.indent())}>
          <IndentIncrease className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton title={`Link (${MOD}K)`} onClick={onLink} active={s.link}>
          <Link className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Image" onClick={onImage} active={s.image}>
          <ImageIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Media" onClick={onMedia} active={s.media}>
          <Film className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton title="Blockquote" onClick={() => run((c) => c.toggleBlockquote())} active={s.blockquote}>
          <Quote className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton title="Source code" onClick={onSource}>
          <CodeXml className="h-4 w-4" />
        </ToolButton>
        <ToolButton title={`Fullscreen (${MOD}Shift+F)`} onClick={onToggleFullscreen} active={fullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </ToolButton>
      </div>

      {s.inTable && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-t border-line-soft bg-surface-muted text-[12.5px]">
          {(
            [
              ["Row above", (c) => c.addRowBefore()],
              ["Row below", (c) => c.addRowAfter()],
              ["Delete row", (c) => c.deleteRow()],
              ["Column left", (c) => c.addColumnBefore()],
              ["Column right", (c) => c.addColumnAfter()],
              ["Delete column", (c) => c.deleteColumn()],
              ["Delete table", (c) => c.deleteTable()],
            ] as [string, (c: ChainedCommands) => ChainedCommands][]
          ).map(([label, fn]) => (
            <button
              key={label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(fn)}
              className={cn(
                "h-7 px-2.5 rounded-md font-medium transition-colors",
                label.startsWith("Delete") ? "text-danger hover:bg-danger-soft" : "text-navy hover:bg-fill",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

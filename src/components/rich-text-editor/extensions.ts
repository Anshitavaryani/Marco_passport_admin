/** @format */

// Tiptap nodes and attributes that keep the HTML TinyMCE used to produce
// (and that's already saved in the database) intact when it's edited here.

import { Extension, Node, mergeAttributes, type CommandProps } from "@tiptap/core";
import CodeBlock from "@tiptap/extension-code-block";
import { DOMSerializer, type DOMOutputSpec, type Node as PMNode } from "@tiptap/pm/model";

// TinyMCE indented paragraphs with padding-left in 40px steps.
const INDENT_STEP_PX = 40;
const INDENTABLE = ["paragraph", "heading", "div"];
const OL_TYPES: Record<string, string> = { "lower-alpha": "a", "upper-alpha": "A", "lower-roman": "i", "upper-roman": "I" };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    contentAttributes: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
      setListStyle: (list: "bulletList" | "orderedList", style: string | null) => ReturnType;
    };
    div: { toggleDiv: () => ReturnType };
    insiderTip: { toggleInsiderTip: () => ReturnType };
    pullQuote: { togglePullQuote: () => ReturnType };
  }
}

// Indent, list style types and blockquote classes on the stock nodes.
export const ContentAttributes = Extension.create({
  name: "contentAttributes",

  addGlobalAttributes() {
    return [
      {
        types: INDENTABLE,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => Math.max(0, Math.round((parseFloat(el.style.paddingLeft) || 0) / INDENT_STEP_PX)),
            renderHTML: ({ indent }) => (indent > 0 ? { style: `padding-left: ${indent * INDENT_STEP_PX}px` } : {}),
          },
        },
      },
      {
        types: ["bulletList", "orderedList"],
        attributes: {
          listStyleType: {
            default: null,
            parseHTML: (el) => el.style.listStyleType || null,
            renderHTML: ({ listStyleType }) => (listStyleType ? { style: `list-style-type: ${listStyleType}` } : {}),
          },
        },
      },
      {
        types: ["blockquote"],
        attributes: {
          class: { default: null },
        },
      },
    ];
  },

  addCommands() {
    const shiftIndent =
      (delta: number) =>
      ({ state, tr, dispatch }: CommandProps) => {
        let changed = false;
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (!INDENTABLE.includes(node.type.name)) return true;
          const indent = Math.max(0, (node.attrs.indent ?? 0) + delta);
          if (indent !== node.attrs.indent) {
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
            changed = true;
          }
          return false;
        });
        return changed;
      };

    return {
      // Inside a list these nest/un-nest the item, like TinyMCE did.
      indent:
        () =>
        (props) =>
          props.editor.isActive("listItem") ? props.commands.sinkListItem("listItem") : shiftIndent(1)(props),
      outdent:
        () =>
        (props) =>
          props.editor.isActive("listItem") ? props.commands.liftListItem("listItem") : shiftIndent(-1)(props),
      setListStyle:
        (list, style) =>
        ({ editor, chain }) => {
          const listStyleType = style && style !== "default" ? style : null;
          // Tiptap also derives <ol type> from the style; keep the two in step.
          const attrs = list === "orderedList" ? { listStyleType, type: OL_TYPES[listStyleType ?? ""] ?? null } : { listStyleType };
          if (editor.isActive(list)) return chain().updateAttributes(list, attrs).run();
          const toggle = list === "bulletList" ? "toggleBulletList" : "toggleOrderedList";
          return chain()[toggle]().updateAttributes(list, attrs).run();
        },
    };
  },
});

const BLOCK_TAGS = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DETAILS", "DIV", "DL", "FIELDSET", "FIGURE", "FOOTER", "FORM",
  "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "MAIN", "NAV", "OL", "P", "PRE", "SECTION", "TABLE", "UL",
]);

// A <div> used as a text block (TinyMCE's Formats > Blocks > Div). The
// Place/Business "About" pages style these as sub-headings.
export const Div = Node.create({
  name: "div",
  group: "block",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (el) =>
          el.classList.contains("insider-tip") || [...el.children].some((c) => BLOCK_TAGS.has(c.tagName)) ? false : null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      toggleDiv:
        () =>
        ({ editor, commands }) =>
          editor.isActive(this.name) ? commands.setParagraph() : commands.setNode(this.name),
    };
  },
});

// The "Insider Tip" callout: a div.insider-tip wrapped around blocks.
export const InsiderTip = Node.create({
  name: "insiderTip",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "div.insider-tip" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "insider-tip" }), 0];
  },

  addCommands() {
    return {
      toggleInsiderTip:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});

// The "Pull Quote" style: a blockquote with class="pull-quote".
export const PullQuote = Extension.create({
  name: "pullQuote",

  addCommands() {
    return {
      togglePullQuote:
        () =>
        ({ editor, commands }) => {
          if (editor.isActive("blockquote", { class: "pull-quote" })) return commands.lift("blockquote");
          if (editor.isActive("blockquote")) return commands.updateAttributes("blockquote", { class: "pull-quote" });
          return commands.wrapIn("blockquote", { class: "pull-quote" });
        },
    };
  },
});

// Formats > Blocks > Pre: a plain <pre>, not Tiptap's <pre><code>.
export const Pre = CodeBlock.extend({
  renderHTML({ HTMLAttributes }) {
    return ["pre", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

// Embedded media is shown inert in the editor (click selects it), like
// TinyMCE's media placeholders.
const inertNodeView = (toSpec: (node: PMNode) => DOMOutputSpec) => () => {
  return ({ node }: { node: PMNode }) => {
    const dom = document.createElement(node.isInline ? "span" : "div");
    dom.className = "rte-media";
    dom.contentEditable = "false";
    dom.append(DOMSerializer.renderSpec(document, toSpec(node)).dom);
    return { dom };
  };
};

const attrs = (...names: string[]) => Object.fromEntries(names.map((n) => [n, { default: null }]));

const iframeSpec = (node: PMNode): DOMOutputSpec => ["iframe", { ...node.attrs }];

export const Iframe = Node.create({
  name: "iframe",
  group: "inline",
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return attrs("src", "width", "height", "allowfullscreen", "frameborder", "allow", "title", "referrerpolicy", "style");
  },
  parseHTML() {
    return [{ tag: "iframe[src]" }];
  },
  renderHTML({ node }) {
    return iframeSpec(node);
  },
  addNodeView: inertNodeView(iframeSpec),
});

const videoSpec = (node: PMNode): DOMOutputSpec => {
  const { src, type, width, height, poster } = node.attrs;
  return ["video", { width, height, poster, controls: "controls" }, ["source", { src, type }]];
};

export const Video = Node.create({
  name: "video",
  group: "inline",
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      ...attrs("width", "height", "poster"),
      src: { default: null, parseHTML: (el) => el.getAttribute("src") || el.querySelector("source")?.getAttribute("src") || null },
      type: { default: null, parseHTML: (el) => el.querySelector("source")?.getAttribute("type") || null },
    };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ node }) {
    return videoSpec(node);
  },
  addNodeView: inertNodeView(videoSpec),
});

const audioSpec = (node: PMNode): DOMOutputSpec => ["audio", { src: node.attrs.src, controls: "controls" }];

export const Audio = Node.create({
  name: "audio",
  group: "inline",
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null, parseHTML: (el) => el.getAttribute("src") || el.querySelector("source")?.getAttribute("src") || null },
    };
  },
  parseHTML() {
    return [{ tag: "audio" }];
  },
  renderHTML({ node }) {
    return audioSpec(node);
  },
  addNodeView: inertNodeView(audioSpec),
});

// figure.image with a caption, as styled by article-content.css. Edited
// through the image dialog.
export const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    const fromImg = (name: string) => ({
      default: null,
      parseHTML: (el: HTMLElement) => el.querySelector("img")?.getAttribute(name) ?? null,
    });
    return {
      src: fromImg("src"),
      alt: fromImg("alt"),
      width: fromImg("width"),
      height: fromImg("height"),
      caption: { default: "", parseHTML: (el) => el.querySelector("figcaption")?.textContent ?? "" },
      class: { default: "image", parseHTML: (el) => el.getAttribute("class") },
    };
  },
  parseHTML() {
    return [{ tag: "figure", getAttrs: (el) => (el.querySelector("img") ? null : false) }];
  },
  renderHTML({ node }) {
    const { src, alt, width, height, caption } = node.attrs;
    return ["figure", { class: node.attrs.class }, ["img", { src, alt, width, height }], ["figcaption", caption ?? ""]];
  },
});

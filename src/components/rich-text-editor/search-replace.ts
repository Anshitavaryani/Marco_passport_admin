/** @format */

// Find and replace (TinyMCE's searchreplace plugin, opened with Ctrl/Cmd+F).

import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

interface SearchQuery {
  term: string;
  caseSensitive: boolean;
  wholeWord: boolean;
}

interface Match {
  from: number;
  to: number;
}

interface SearchState extends SearchQuery {
  matches: Match[];
  current: number;
}

const searchKey = new PluginKey<SearchState>("searchReplace");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearch: (query: SearchQuery) => ReturnType;
      clearSearch: () => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceMatch: (replacement: string) => ReturnType;
      replaceAllMatches: (replacement: string) => ReturnType;
    };
  }
}

const findMatches = (doc: PMNode, { term, caseSensitive, wholeWord }: SearchQuery): Match[] => {
  if (!term) return [];
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(wholeWord ? `\\b${escaped}\\b` : escaped, caseSensitive ? "g" : "gi");
  const matches: Match[] = [];

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // The block's text, with each character's document position.
    let text = "";
    const positions: number[] = [];
    node.forEach((child, offset) => {
      const start = pos + 1 + offset;
      if (child.isText) {
        for (let i = 0; i < child.text!.length; i++) positions.push(start + i);
        text += child.text;
      } else {
        positions.push(start);
        text += "￼";
      }
    });
    for (const m of text.matchAll(re)) {
      if (m[0]) matches.push({ from: positions[m.index], to: positions[m.index + m[0].length - 1] + 1 });
    }
    return false;
  });
  return matches;
};

const empty: SearchState = { term: "", caseSensitive: false, wholeWord: false, matches: [], current: 0 };

export const getSearchState = (state: EditorState) => searchKey.getState(state) ?? empty;

// Selects the current match so it scrolls into view.
const select = (tr: EditorState["tr"], match?: Match) =>
  match ? tr.setSelection(TextSelection.create(tr.doc, match.from, match.to)).scrollIntoView() : tr;

export const SearchReplace = Extension.create({
  name: "searchReplace",

  addCommands() {
    const move =
      (step: number) =>
      () =>
      ({ state, tr, dispatch }) => {
        const s = getSearchState(state);
        if (!s.matches.length) return false;
        const current = (s.current + step + s.matches.length) % s.matches.length;
        if (dispatch) select(tr.setMeta(searchKey, { current }), s.matches[current]);
        return true;
      };

    return {
      setSearch:
        (query) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(searchKey, { ...query, current: 0 });
          return true;
        },
      clearSearch:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(searchKey, { term: "", current: 0 });
          return true;
        },
      findNext: move(1),
      findPrevious: move(-1),
      replaceMatch:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const { matches, current } = getSearchState(state);
          const match = matches[current];
          if (!match) return false;
          if (dispatch) tr.insertText(replacement, match.from, match.to);
          return true;
        },
      replaceAllMatches:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const { matches } = getSearchState(state);
          if (!matches.length) return false;
          if (dispatch) [...matches].reverse().forEach((m) => tr.insertText(replacement, m.from, m.to));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchKey,
        state: {
          init: () => empty,
          apply(tr, prev) {
            const meta = tr.getMeta(searchKey) as Partial<SearchState> | undefined;
            if (!meta && !tr.docChanged) return prev;
            const next = { ...prev, ...meta };
            next.matches = findMatches(tr.doc, next);
            next.current = Math.min(next.current, Math.max(0, next.matches.length - 1));
            return next;
          },
        },
        props: {
          decorations(state) {
            const { matches, current } = getSearchState(state);
            if (!matches.length) return null;
            return DecorationSet.create(
              state.doc,
              matches.map((m, i) =>
                Decoration.inline(m.from, m.to, { class: i === current ? "rte-search-current" : "rte-search-match" }),
              ),
            );
          },
        },
      }),
    ];
  },
});

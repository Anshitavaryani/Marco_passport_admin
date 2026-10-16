/** @format */

// Shared TinyMCE setup for the Blog, Place and Business editors.

// Named styles admins can apply from the editor's "Styles" dropdown. Each one
// needs a matching rule in editorContentStyle below, in
// pages/Blog/article-content.css and in the live site's article stylesheet.
export const EDITOR_STYLE_FORMATS = [
  { title: "Insider Tip", block: "div", classes: "insider-tip", wrapper: true },
  { title: "Pull Quote", block: "blockquote", classes: "pull-quote", wrapper: true },
];

// TinyMCE renders into an iframe that can't see the app's CSS variables, so
// the theme colours (index.css) are read off :root and inlined.
const color = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();

// WYSIWYG preview CSS. Call it while rendering, once the stylesheet has loaded.
export const editorContentStyle = (imageAspectRatio: string) => `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; line-height: 1.6; color: ${color("navy")}; padding: 8px 12px; }
  body > p:first-of-type::first-letter { float: left; font-family: Georgia, "Times New Roman", serif; font-size: 64px; line-height: 0.85; font-weight: 600; padding: 4px 8px 0 0; color: ${color("navy")}; }
  .insider-tip { background: ${color("parchment")}; border-left: 3px solid ${color("gold-light")}; border-radius: 8px; padding: 14px 16px; margin: 16px 0; }
  .insider-tip::before { content: "Insider tip"; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: ${color("gold-dark")}; margin-bottom: 4px; }
  blockquote.pull-quote { border-left: 3px solid ${color("navy")}; padding-left: 16px; margin: 20px 0; font-style: italic; font-size: 18px; color: ${color("navy")}; }
  blockquote:not(.pull-quote) { border-left: 3px solid ${color("line-strong")}; padding-left: 16px; margin: 16px 0; color: ${color("ink-muted")}; }
  img { width: 100%; aspect-ratio: ${imageAspectRatio}; object-fit: cover; border-radius: 8px; margin: 16px 0; }
  figure.image { margin: 16px 0; }
  figure.image img { margin: 0; }
  figure.image figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: ${color("ink-faint")}; text-align: center; margin-top: 8px; }
`;

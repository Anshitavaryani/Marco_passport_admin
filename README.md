# Marco Passport Admin

Admin panel for the Marco Passport: places, businesses, blog posts, users and admin accounts.

Built with React 19, React Router, Vite, Tailwind CSS v4 and a few shadcn/ui components.

## Getting started

Requires Node.js 22.22 or newer.

```sh
cp .env.example .env   # then fill in the API URLs
npm install
npm run dev            # http://localhost:8080
```

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run build`     | Production build into `dist/`         |
| `npm run preview`   | Serve the production build locally    |
| `npm run typecheck` | Type-check with TypeScript            |
| `npm run lint`      | Lint with ESLint                      |

## Colours and theme

Every colour is defined once, in [src/index.css](src/index.css), as a Tailwind theme token (`navy`, `gold-light`, `ink-muted`, `line`, `danger`, ...). Use the generated utilities in markup:

```tsx
<h1 className="text-navy">Places</h1>
<button className="bg-gold-light text-navy">Add place</button>
<div className="bg-white border border-line shadow-card">...</div>
```

Don't write hex values or `style={{ color: ... }}` in components. Tailwind's default palette is switched off, so classes like `bg-blue-500` don't exist. If a new colour is needed, add it to the theme first.

Plain stylesheets (the article preview and the editor's content area) use the same tokens as `var(--color-*)`.

## Rich-text editor

Blog content and the Place/Business "About" fields use [src/components/rich-text-editor](src/components/rich-text-editor), built on [Tiptap](https://tiptap.dev). It reads and writes the same HTML TinyMCE used to (insider tips, pull quotes, `div` sub-headings, list styles, indents, embeds), so existing content edits cleanly and renders unchanged on the live site. Images dropped, pasted or picked in the editor upload through `uploadEditorImage` in [src/lib/editor.ts](src/lib/editor.ts).

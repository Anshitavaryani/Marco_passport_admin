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

The TinyMCE editors render inside an iframe, so [src/lib/editor.ts](src/lib/editor.ts) reads the same tokens from `:root` at runtime.

## TinyMCE

The editors load TinyMCE from `/tinymce`. `vite.config.ts` copies it out of `node_modules/tinymce` on every dev or build run, so the version served is always the one in `package.json`. `public/tinymce/` is generated and git-ignored.

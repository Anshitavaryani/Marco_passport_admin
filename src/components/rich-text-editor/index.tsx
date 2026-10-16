/** @format */

import { lazy, Suspense, type ComponentProps } from "react";
import { Loader2 } from "lucide-react";

// Loaded on demand, so only the pages with an editor download Tiptap.
const LazyRichTextEditor = lazy(() => import("./RichTextEditor").then((m) => ({ default: m.RichTextEditor })));

export function RichTextEditor(props: ComponentProps<typeof LazyRichTextEditor>) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-white" style={{ height: props.height }}>
          <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
        </div>
      }
    >
      <LazyRichTextEditor {...props} />
    </Suspense>
  );
}

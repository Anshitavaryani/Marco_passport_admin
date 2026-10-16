/** @format */

// Turns a pasted media URL into an embed, with the same rules and default
// sizes as TinyMCE's media plugin.

import type { JSONContent } from "@tiptap/core";

const PATTERNS: { regex: RegExp; url: string; w: number; h: number; allowFullscreen: boolean }[] = [
  { regex: /youtu\.be\/([\w\-_?&=.]+)/i, url: "www.youtube.com/embed/$1", w: 560, h: 314, allowFullscreen: true },
  { regex: /youtube\.com(.+)v=([^&]+)(&([a-z0-9&=\-_]+))?/i, url: "www.youtube.com/embed/$2?$4", w: 560, h: 314, allowFullscreen: true },
  { regex: /youtube.com\/embed\/([a-z0-9?&=\-_]+)/i, url: "www.youtube.com/embed/$1", w: 560, h: 314, allowFullscreen: true },
  { regex: /vimeo\.com\/([0-9]+)\?h=(\w+)/, url: "player.vimeo.com/video/$1?h=$2&title=0&byline=0&portrait=0&color=8dc7dc", w: 425, h: 350, allowFullscreen: true },
  { regex: /vimeo\.com\/(.*)\/([0-9]+)\?h=(\w+)/, url: "player.vimeo.com/video/$2?h=$3&title=0&byline=0", w: 425, h: 350, allowFullscreen: true },
  { regex: /vimeo\.com\/([0-9]+)/, url: "player.vimeo.com/video/$1?title=0&byline=0&portrait=0&color=8dc7dc", w: 425, h: 350, allowFullscreen: true },
  { regex: /vimeo\.com\/(.*)\/([0-9]+)/, url: "player.vimeo.com/video/$2?title=0&byline=0", w: 425, h: 350, allowFullscreen: true },
  { regex: /maps\.google\.([a-z]{2,3})\/maps\/(.+)msid=(.+)/, url: "maps.google.com/maps/ms?msid=$2&output=embed", w: 425, h: 350, allowFullscreen: false },
  { regex: /dailymotion\.com\/video\/([^_]+)/, url: "www.dailymotion.com/embed/video/$1", w: 480, h: 270, allowFullscreen: true },
  { regex: /dai\.ly\/([^_]+)/, url: "www.dailymotion.com/embed/video/$1", w: 480, h: 270, allowFullscreen: true },
];

const MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/x-m4a",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
};

export interface MediaValues {
  source: string;
  width: string;
  height: string;
}

export const mediaFromUrl = ({ source, width, height }: MediaValues): JSONContent => {
  const url = source.trim();
  const pattern = PATTERNS.find((p) => p.regex.test(url));
  if (pattern) {
    const protocol = /^http:\/\//i.test(url) ? "http://" : "https://";
    const match = pattern.regex.exec(url)!;
    const src = (protocol + pattern.url.replace(/\$(\d)/g, (_, i) => match[i] ?? "")).replace(/\?$/, "");
    return {
      type: "iframe",
      attrs: {
        src,
        width: width || String(pattern.w),
        height: height || String(pattern.h),
        allowfullscreen: pattern.allowFullscreen ? "1" : null,
      },
    };
  }

  const mime = MIME_TYPES[url.toLowerCase().split(/[?#]/)[0].split(".").pop() ?? ""] ?? null;
  if (mime?.startsWith("audio")) return { type: "audio", attrs: { src: url } };
  return { type: "video", attrs: { src: url, type: mime, width: width || "300", height: height || "150" } };
};

/** @format */

// Converts between the HTML stored in the database (written by TinyMCE, and
// rendered as-is by the live site) and Tiptap's own HTML:
//   - TinyMCE padded empty blocks with &nbsp; so blank lines keep their
//     height; Tiptap writes them as truly empty.
//   - Tiptap wraps list-item and table-cell text in <p>, which would add
//     paragraph margins inside lists on the live site.

const PADDED_BLOCKS = "p, h1, h2, h3, h4, h5, h6, div";

const parse = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template;
};

export const fromStoredHtml = (html: string) => {
  if (!html.includes("&nbsp;")) return html;
  const template = parse(html);
  template.content.querySelectorAll<HTMLElement>(PADDED_BLOCKS).forEach((el) => {
    if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE && el.textContent === " ") {
      el.textContent = "";
    }
  });
  return template.innerHTML;
};

export const toStoredHtml = (html: string) => {
  const template = parse(html);
  const root = template.content;

  root.querySelectorAll("li, td, th").forEach((cell) => {
    const paragraphs = [...cell.children].filter((c) => c.tagName === "P");
    const onlyListsBesides = [...cell.children].every((c) => c.tagName === "P" || c.tagName === "UL" || c.tagName === "OL");
    const [p] = paragraphs;
    if (paragraphs.length === 1 && onlyListsBesides && !p.attributes.length) p.replaceWith(...p.childNodes);
  });

  root.querySelectorAll(PADDED_BLOCKS).forEach((el) => {
    if (!el.childNodes.length) el.innerHTML = "&nbsp;";
  });

  return template.innerHTML;
};

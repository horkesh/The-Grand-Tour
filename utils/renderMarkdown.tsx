import React from 'react';

/**
 * Tiny inline-markdown renderer for the chat. Handles **bold**, *italic*, and
 * [link text](url) — including nested cases like **[Place](url)** by rendering
 * bold/italic content recursively. Newlines are preserved by the parent's
 * whitespace-pre-wrap class.
 */
const KEY = { n: 0 };
const PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;

function render(text: string): React.ReactNode[] {
  if (!text) return [];
  const nodes: React.ReactNode[] = [];
  const matches = Array.from(text.matchAll(PATTERN));
  let cursor = 0;
  for (const m of matches) {
    const start = m.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    if (m[1] !== undefined && m[2] !== undefined) {
      // [text](url) — link
      nodes.push(
        <a
          key={KEY.n++}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-300 underline underline-offset-2 decoration-2 hover:opacity-80"
        >
          {render(m[1])}
        </a>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={KEY.n++}>{render(m[3])}</strong>);
    } else if (m[4] !== undefined) {
      nodes.push(<em key={KEY.n++}>{render(m[4])}</em>);
    }
    cursor = start + m[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function renderMarkdown(text: string): React.ReactNode[] {
  KEY.n = 0;
  return render(text);
}

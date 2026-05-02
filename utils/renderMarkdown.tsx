import React from 'react';

/**
 * Tiny inline-markdown renderer for the chat. Handles **bold**, *italic*, and
 * [link text](url) — that's enough for what Gemini emits and avoids pulling
 * in a full markdown library. Newlines are preserved by the parent's
 * whitespace-pre-wrap class.
 */
export function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  const matches = Array.from(text.matchAll(pattern));
  let cursor = 0;
  let key = 0;
  for (const m of matches) {
    const start = m.index ?? 0;
    if (start > cursor) {
      nodes.push(text.slice(cursor, start));
    }
    if (m[1] !== undefined) {
      nodes.push(<strong key={key++}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<em key={key++}>{m[2]}</em>);
    } else if (m[3] !== undefined && m[4] !== undefined) {
      nodes.push(
        <a
          key={key++}
          href={m[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 decoration-2 hover:opacity-80"
        >
          {m[3]}
        </a>,
      );
    }
    cursor = start + m[0].length;
  }
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return nodes;
}

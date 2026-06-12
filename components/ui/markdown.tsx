import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal, dependency-free markdown renderer supporting headings, bold,
 * unordered/ordered lists and paragraphs. Sufficient for AI-generated audit /
 * report / plan content.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = parse(content);
  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {blocks.map((b, i) => {
        if (b.type === "ul")
          return (
            <ul key={i} className="ml-5 list-disc space-y-1">
              {b.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </ul>
          );
        if (b.type === "ol")
          return (
            <ol key={i} className="ml-5 list-decimal space-y-1">
              {b.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </ol>
          );
        if (b.type === "h1")
          return <h1 key={i} className="text-xl font-semibold tracking-tight">{inline(b.text)}</h1>;
        if (b.type === "h2")
          return <h2 key={i} className="mt-2 text-base font-semibold">{inline(b.text)}</h2>;
        if (b.type === "h3")
          return <h3 key={i} className="mt-1 text-sm font-semibold">{inline(b.text)}</h3>;
        return <p key={i} className="text-muted-foreground">{inline(b.text)}</p>;
      })}
    </div>
  );
}

interface Block {
  type: "h1" | "h2" | "h3" | "p" | "ul" | "ol";
  text: string;
  items: string[];
}

function block(type: Block["type"], text = "", items: string[] = []): Block {
  return { type, text, items };
}

function parse(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let list: Block | null = null;

  const flush = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push(block("h3", line.slice(4)));
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push(block("h2", line.slice(3)));
    } else if (line.startsWith("# ")) {
      flush();
      blocks.push(block("h1", line.slice(2)));
    } else if (/^\s*[-*]\s+/.test(line)) {
      if (!list || list.type !== "ul") {
        flush();
        list = block("ul");
      }
      list.items.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (!list || list.type !== "ol") {
        flush();
        list = block("ol");
      }
      list.items.push(line.replace(/^\s*\d+\.\s+/, ""));
    } else {
      flush();
      blocks.push(block("p", line));
    }
  }
  flush();
  return blocks;
}

/** Renders inline **bold** and `code`. */
function inline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {p.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

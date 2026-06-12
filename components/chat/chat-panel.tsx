"use client";

import * as React from "react";
import { Send, Sparkles, User2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Why did ACOS change last week?",
  "Which campaigns should I cut?",
  "Which keywords should I scale?",
  "Find wasted spend.",
  "Which SQP queries have high impression share but low PPC investment?",
  "Give me a marketing plan for this brand.",
];

export function ChatPanel({
  clientId,
  period = "30d",
}: {
  clientId: string;
  period?: string;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    const history = [...messages, { role: "user" as const, content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period, messages: history }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't generate a response.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col rounded-xl border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-full bg-primary/10 p-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold">Amazon Ads Co-pilot</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Grounded in this client&apos;s live data. Ask about performance, wasted
              spend, scaling opportunities or SQP strategy.
            </p>
            <div className="mt-5 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border bg-background p-3 text-left text-sm transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} message={m} streaming={streaming && i === messages.length - 1} />)
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this client's performance…"
          disabled={streaming}
        />
        <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ message, streaming }: { message: Message; streaming: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-secondary" : "bg-primary/10 text-primary"
        )}
      >
        {isUser ? <User2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.content || (streaming ? <span className="opacity-60">Thinking…</span> : "")}
      </div>
    </div>
  );
}

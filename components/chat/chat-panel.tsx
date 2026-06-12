"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | undefined>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || loading) return;

    const nextUserMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, nextUserMessage, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          message: nextUserMessage.content,
          chatSessionId
        })
      });

      const nextSessionId = response.headers.get("x-chat-session-id");
      if (nextSessionId) {
        setChatSessionId(nextSessionId);
      }

      if (!response.body) {
        throw new Error("No response stream available.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          accumulated += decoder.decode(result.value, { stream: true });
          setMessages((prev) => {
            const cloned = [...prev];
            const lastMessage = cloned[cloned.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              lastMessage.content = accumulated;
            }
            return cloned;
          });
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const cloned = [...prev];
        const lastMessage = cloned[cloned.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content =
            error instanceof Error ? error.message : "Unable to complete the request.";
        }
        return cloned;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 space-y-2">
        <h3 className="text-base font-semibold text-slate-900">AI Co-Pilot</h3>
        <p className="text-sm text-slate-600">
          Ask strategy questions. The assistant is constrained to your provided client data.
        </p>
      </div>
      <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Try: “Why did ACOS increase last week?” or “Find wasted spend.”
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-md px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-auto max-w-[80%] bg-teal-700 text-white"
                  : "max-w-[90%] bg-white text-slate-800"
              }`}
            >
              {message.content || (loading ? "Thinking..." : "")}
            </div>
          ))
        )}
      </div>
      <form className="flex gap-2" onSubmit={onSubmit}>
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about ACOS, ROAS, waste, SQP opportunities..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Streaming..." : "Send"}
        </Button>
      </form>
    </div>
  );
}

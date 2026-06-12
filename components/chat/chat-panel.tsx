"use client";

import { useState, useTransition } from "react";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const prompts = [
  "Why did ACOS increase last week?",
  "Which campaigns should I cut?",
  "Which keywords should I scale?",
  "Find wasted spend.",
  "Which SQP queries have high impression share but low PPC investment?",
];

export function ChatPanel({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ask me about ACOS, wasted spend, keyword scaling, SQP gaps, or weekly reporting. I will only use the client data supplied by the app.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  async function sendMessage(question = input) {
    const trimmed = question.trim();
    if (!trimmed) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", content: trimmed }, { role: "assistant", content: "" }]);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, message: trimmed, range: "30d" }),
        });

        if (!response.ok || !response.body) {
          setMessages((current) =>
            current.map((message, index) =>
              index === current.length - 1 ? { ...message, content: "Unable to generate a response. Please try again." } : message,
            ),
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setMessages((current) =>
            current.map((message, index) => (index === current.length - 1 ? { ...message, content: message.content + chunk } : message)),
          );
        }
      })();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI co-pilot</CardTitle>
        <CardDescription>Claude-powered strategist using only supplied client data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              onClick={() => sendMessage(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="h-[480px] space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role === "assistant" ? (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
              ) : null}
              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm",
                )}
              >
                {message.content || "Thinking..."}
              </div>
              {message.role === "user" ? (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                  <User className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about ACOS, TACOS, SQP opportunities, budget allocation..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button className="self-end" disabled={isPending} onClick={() => sendMessage()} type="button">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

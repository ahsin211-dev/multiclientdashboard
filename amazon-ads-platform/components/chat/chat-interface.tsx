"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Search,
  FileText,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatInterfaceProps {
  clientId: string;
  clientName: string;
}

const QUICK_PROMPTS = [
  { icon: TrendingDown, label: "Why did ACOS increase?", prompt: "Why did our ACOS increase last week? What are the main drivers and what should I do?" },
  { icon: TrendingUp, label: "Find scaling opportunities", prompt: "Which campaigns and keywords should I scale? Show me the highest-ROAS opportunities with specific budget recommendations." },
  { icon: DollarSign, label: "Find wasted spend", prompt: "Where is money being wasted? Identify campaigns and keywords with high spend but poor conversion. Give me specific cut recommendations." },
  { icon: Search, label: "SQP analysis", prompt: "Analyze our Search Query Performance data. Which high-impression queries are underinvested in PPC? What are the top scaling opportunities?" },
  { icon: FileText, label: "Weekly report", prompt: "Create a weekly performance report for this client. Include executive summary, key metrics, top findings, and recommended actions." },
  { icon: Sparkles, label: "Marketing plan", prompt: "Create a 30-day marketing plan for this brand based on the current performance data. Include campaign restructuring, budget allocation, and keyword strategy." },
];

function MessageContent({ content }: { content: string }) {
  // Simple markdown rendering for bold, bullets, headers
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return <h3 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(3)}</h3>;
        }
        if (line.startsWith("### ")) {
          return <h4 key={i} className="text-sm font-semibold mt-2 mb-0.5">{line.slice(4)}</h4>;
        }
        if (line.startsWith("- **") || line.startsWith("* **")) {
          const text = line.slice(2);
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span className="text-sm" dangerouslySetInnerHTML={{
                __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              }} />
            </div>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span className="text-sm">{line.slice(2)}</span>
            </div>
          );
        }
        if (line.startsWith("|") && line.endsWith("|")) {
          return <code key={i} className="block text-xs font-mono bg-muted px-2 py-0.5 rounded">{line}</code>;
        }
        if (line.trim() === "" || line === "---") {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          }} />
        );
      })}
    </div>
  );
}

export function ChatInterface({ clientId, clientName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          message: content.trim(),
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamingContent(accumulated);
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: accumulated,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to get response";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I encountered an error: ${errMsg}\n\nPlease check that your ANTHROPIC_API_KEY is configured in environment variables.`,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent("");
  };

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center gap-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Amazon Ads AI Co-Pilot</h3>
              <p className="text-sm text-muted-foreground">
                Ask me anything about <strong>{clientName}</strong>&apos;s Amazon advertising performance. I&apos;ll only use real client data to answer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              {QUICK_PROMPTS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.label}
                    onClick={() => sendMessage(p.prompt)}
                    className="flex items-center gap-2 px-3 py-2.5 text-left rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role === "assistant" && (
              <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-3xl rounded-xl px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground"
              )}
            >
              {message.role === "user" ? (
                <p className="text-sm">{message.content}</p>
              ) : (
                <MessageContent content={message.content} />
              )}
              <p className={cn("text-xs mt-2 opacity-60")}>
                {message.createdAt.toLocaleTimeString()}
              </p>
            </div>
            {message.role === "user" && (
              <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">AJ</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 shrink-0 mt-0.5">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="max-w-3xl rounded-xl px-4 py-3 bg-muted/60">
              <MessageContent content={streamingContent} />
              <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="rounded-xl px-4 py-3 bg-muted/60">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-background">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_PROMPTS.slice(0, 3).map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <Icon className="w-3 h-3" />
                  {p.label}
                </button>
              );
            })}
            <button
              onClick={clearChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              New chat
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${clientName}'s Amazon ads performance...`}
            className="min-h-[52px] max-h-32 resize-none flex-1"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[52px] w-[52px] shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI uses only real client data · No hallucination · Powered by Claude
        </p>
      </div>
    </div>
  );
}

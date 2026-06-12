"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ChatPanelProps = {
  clientId: string;
  preset: "7d" | "30d" | "custom";
};

const suggestions = [
  "Why did ACOS increase last week?",
  "Which campaigns should I cut?",
  "Which keywords should I scale?",
  "Create a weekly client report.",
];

export function ChatPanel({ clientId, preset }: ChatPanelProps) {
  const [question, setQuestion] = useState(suggestions[0]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setAnswer("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        question,
        preset,
      }),
    });

    if (!response.body) {
      setAnswer("The streaming response was unavailable.");
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      setAnswer((current) => current + decoder.decode(value));
    }

    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Ask the Amazon co-pilot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuestion(suggestion)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about client performance..."
          />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading}>
              {loading ? "Thinking..." : "Stream answer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {answer || "Ask a question to stream a grounded, client-specific strategy response."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

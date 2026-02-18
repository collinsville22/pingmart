"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { MessageBubble } from "./message-bubble";
import type { UIMessage } from "ai";
import type { DomainCheckResult } from "@/types";

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path d="M4 4l7.2 16h1.6L20 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-bg-elevated border border-border-subtle">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent/40"
              style={{
                animation: "typing-dot 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function extractToolResults(message: UIMessage): DomainCheckResult[] {
  const results: DomainCheckResult[] = [];
  for (const part of message.parts) {
    if (
      part.type === "dynamic-tool" &&
      part.toolName === "checkDomains" &&
      part.state === "output-available"
    ) {
      const data = part.output;
      if (Array.isArray(data)) {
        results.push(...data);
      }
    }
  }
  return results;
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatPanel() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isActive = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isActive]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isActive) return;
    setInput("");
    sendMessage({ text });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border-subtle">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-xs font-medium text-text-secondary tracking-wide">AI Naming Agent</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M4 4l7.2 16h1.6L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary mb-1.5">Describe your project</p>
            <p className="text-xs text-text-tertiary max-w-[260px] leading-relaxed">
              I&apos;ll find Web3 names across ENS, Solana, NEAR, and Base — checked in real-time.
            </p>

            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {[
                "I'm building a DeFi protocol",
                "NFT marketplace project",
                "DAO for open source devs",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="px-3.5 py-1.5 text-xs rounded-full bg-bg-elevated border border-border-subtle
                    text-text-secondary hover:text-accent hover:border-accent/25
                    transition-all duration-200 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const toolResults = extractToolResults(message);
          const textContent = getTextContent(message);

          if (!textContent && toolResults.length === 0) return null;

          return (
            <MessageBubble
              key={message.id}
              role={message.role as "user" | "assistant"}
              content={textContent}
              toolResults={message.role === "assistant" ? toolResults : undefined}
            />
          );
        })}

        {isActive && <TypingIndicator />}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border-subtle"
      >
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your Web3 project..."
            className="w-full h-11 rounded-xl bg-bg-elevated border border-border-subtle
              text-sm text-text-primary placeholder:text-text-tertiary
              focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/8
              transition-all duration-200 pl-4 pr-12 font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isActive}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg
              bg-accent text-[#050505] flex items-center justify-center
              disabled:opacity-25 disabled:cursor-not-allowed
              hover:bg-accent-strong transition-all duration-200 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

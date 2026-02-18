import type { DomainCheckResult } from "@/types";
import { SuggestionCard } from "./suggestion-card";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  toolResults?: DomainCheckResult[];
}

export function MessageBubble({ role, content, toolResults }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] ${isUser ? "order-1" : ""}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-accent">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="text-[11px] text-text-tertiary font-medium tracking-wide">pingmart</span>
          </div>
        )}

        <div
          className={`
            rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${isUser
              ? "bg-accent/8 text-text-primary border border-accent/12"
              : "bg-bg-elevated text-text-primary border border-border-subtle"
            }
          `}
        >
          <div className="whitespace-pre-wrap">{content}</div>
        </div>

        {toolResults && toolResults.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2">
            {toolResults.map((result) => (
              <SuggestionCard
                key={result.domain}
                domain={result.domain}
                available={result.available}
                price={result.price}
                premium={result.premium}
                chain={result.chain}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

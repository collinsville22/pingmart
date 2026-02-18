import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { DOMAIN_AGENT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { checkDomainsTool } from "@/lib/ai/tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: DOMAIN_AGENT_SYSTEM_PROMPT,
    messages,
    tools: {
      checkDomains: checkDomainsTool,
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}

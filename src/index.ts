#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import OpenAI from "openai";
import { z } from "zod";
import { readFileSync } from "node:fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  timeout: 60000000,
});

const server = new McpServer({
  name: "expertmcp",
  version: "1.0.0",
});

server.tool(
  "ask_expert",
  "Ask an expert about a specific topic. Each invocation is independent and does not retain conversation history.",
  {
    question: z.string().describe("The question to ask the expert"),
  },
  async ({ question }) => {
    try {
      const systemPrompt =
        process.env.EXPERT_SYSTEM_PROMPT_FILE
          ? readFileSync(process.env.EXPERT_SYSTEM_PROMPT_FILE, "utf8")
          : process.env.EXPERT_SYSTEM_PROMPT ||
            "You are a helpful expert. Answer the user's question concisely and accurately.";

      const model = process.env.EXPERT_MODEL || "gpt-4o-mini";

      const maxRetries = 100;
      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const completion = await openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: question },
            ],
          });

          const answer = completion.choices[0]?.message?.content || "No answer received.";

          return {
            content: [{ type: "text", text: answer }],
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          const status = (lastError as any)?.status;

          const isRetryable =
            !status ||
            status === 429 ||
            status === 500 ||
            status === 502 ||
            status === 503 ||
            status === 504;

          if (!isRetryable || attempt === maxRetries) {
            break;
          }

          const delay = 1000 * 5 ** (attempt * attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      const message = lastError instanceof Error ? lastError.message : String(lastError);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

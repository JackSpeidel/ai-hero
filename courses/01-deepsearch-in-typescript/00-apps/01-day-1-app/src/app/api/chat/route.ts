import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
} from "ai";
import { z } from "zod";
import { auth } from "~/server/auth";
import { model } from "~/models";
import { searchSerper } from "~/serper";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    messages: Array<Message>;
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { messages } = body;

      const result = streamText({
        model,
        messages,
        system: `You are a helpful AI assistant with access to web search capabilities. 

IMPORTANT: Always use the searchWeb tool to find current information when users ask questions that require up-to-date knowledge, facts, or recent events. Do not rely solely on your training data for current information.

When you search the web:
1. Use the searchWeb tool to find relevant information
2. Always cite your sources with inline links in the format [source name](link)
3. Provide accurate, up-to-date information based on the search results
4. If you find conflicting information, mention this and explain the differences

For general questions that don't require current information, you can respond using your knowledge, but always prefer to search for the most recent and accurate information available.

Be helpful, accurate, and always cite your sources when using web search results.`,
        tools: {
          searchWeb: {
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
            }),
            execute: async ({ query }, { abortSignal }) => {
              const results = await searchSerper(
                { q: query, num: 10 },
                abortSignal,
              );

              return results.organic.map((result) => ({
                title: result.title,
                link: result.link,
                snippet: result.snippet,
              }));
            },
          },
        },
        maxSteps: 10,
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
} 
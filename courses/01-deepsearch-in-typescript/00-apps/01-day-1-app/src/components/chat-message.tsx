import ReactMarkdown, { type Components } from "react-markdown";
import { Search, ExternalLink, Info } from "lucide-react";
import type { Message } from "ai";

export type MessagePart = NonNullable<Message["parts"]>[number];

interface ChatMessageProps {
  message: Message;
  userName: string;
}

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

function ToolInvocationPart({ part }: { part: MessagePart }) {
  if (part.type !== "tool-invocation") return null;
  const { toolInvocation } = part;
  
  const isSearchTool = toolInvocation.toolName === "searchWeb";
  const hasResult = "result" in toolInvocation && toolInvocation.result !== undefined;
  
  return (
    <div className="my-4 rounded-lg border border-gray-600 bg-gray-800/50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/20">
          <Search className="size-3 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-blue-300">
            {isSearchTool ? "Web Search" : toolInvocation.toolName}
          </div>
          <div className="text-xs text-gray-400">
            {toolInvocation.state === "call" && !hasResult && "Searching..."}
            {toolInvocation.state === "result" && hasResult && "Search completed"}
          </div>
        </div>
      </div>

      {/* Search Query */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-400 mb-1">Search Query</div>
        <div className="rounded bg-gray-700 px-3 py-2 text-sm text-gray-200">
          {toolInvocation.args.query}
        </div>
      </div>

      {/* Results */}
      {hasResult && Array.isArray(toolInvocation.result) && (
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2">Found {toolInvocation.result.length} results</div>
          <div className="space-y-2">
            {toolInvocation.result.slice(0, 3).map((result: any, idx: number) => (
              <div key={idx} className="rounded bg-gray-700 p-3">
                <div className="flex items-start gap-2">
                  <ExternalLink className="size-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-blue-300 mb-1 line-clamp-1">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-400 mb-1 line-clamp-1">
                      {result.link}
                    </div>
                    <div className="text-xs text-gray-300 line-clamp-2">
                      {result.snippet}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {toolInvocation.result.length > 3 && (
              <div className="text-xs text-gray-400 text-center py-1">
                +{toolInvocation.result.length - 3} more results
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info hint */}
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
        <Info className="size-3" />
        <span className="cursor-help" title="This shows the AI's web search tool calls and results">
          Tool invocation details
        </span>
      </div>
    </div>
  );
}

export const ChatMessage = ({ message, userName }: ChatMessageProps) => {
  const isAI = message.role === "assistant";
  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${
          isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>
        <div className="prose prose-invert max-w-none">
          {message.parts?.map((part, idx) => {
            if (part.type === "text") {
              return <Markdown key={idx}>{part.text}</Markdown>;
            }
            if (part.type === "tool-invocation") {
              return <ToolInvocationPart key={idx} part={part} />;
            }
            // Skip unsupported types silently
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

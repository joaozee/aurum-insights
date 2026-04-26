import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReportChartRenderer from './ReportChartRenderer';

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;
  
  const parsedResults = (() => {
    if (!results) return null;
    try {
      return typeof results === 'string' ? JSON.parse(results) : results;
    } catch {
      return results;
    }
  })();
  
  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );
  
  const statusConfig = {
    pending: { icon: Clock, color: 'text-slate-400', text: 'Pendente' },
    running: { icon: Loader2, color: 'text-violet-500', text: 'Executando...', spin: true },
    in_progress: { icon: Loader2, color: 'text-violet-500', text: 'Executando...', spin: true },
    completed: isError ? 
      { icon: AlertCircle, color: 'text-red-400', text: 'Erro' } : 
      { icon: CheckCircle2, color: 'text-emerald-400', text: 'Concluído' },
    success: { icon: CheckCircle2, color: 'text-emerald-400', text: 'Concluído' },
    failed: { icon: AlertCircle, color: 'text-red-400', text: 'Erro' },
    error: { icon: AlertCircle, color: 'text-red-400', text: 'Erro' }
  }[status] || { icon: Zap, color: 'text-gray-500', text: '' };
  
  const Icon = statusConfig.icon;
  const formattedName = name.split('.').pop().replace(/([A-Z])/g, ' $1').trim();
  
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs",
          "hover:bg-gray-800/50",
          expanded ? "bg-gray-800/50 border-gray-700" : "bg-gray-900 border-gray-800"
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-gray-300 font-medium">{formattedName}</span>
        {statusConfig.text && (
          <span className={cn("text-xs", isError ? "text-red-400" : "text-gray-500")}>
            • {statusConfig.text}
          </span>
        )}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-gray-500 transition-transform ml-auto", 
            expanded && "rotate-90")} />
        )}
      </button>
      
      {expanded && !statusConfig.spin && (
        <div className="mt-2 ml-3 pl-3 border-l-2 border-gray-800 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Parâmetros:</div>
              <pre className="bg-gray-800 rounded-lg p-2 text-xs text-gray-400 whitespace-pre-wrap">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                  } catch {
                    return toolCall.arguments_string;
                  }
                })()}
              </pre>
            </div>
          )}
          {parsedResults && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Resultado:</div>
              <pre className="bg-gray-800 rounded-lg p-2 text-xs text-gray-400 whitespace-pre-wrap max-h-48 overflow-auto">
                {typeof parsedResults === 'object' ? 
                  JSON.stringify(parsedResults, null, 2) : parsedResults}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-3",
            isUser 
              ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20" 
              : "bg-gray-800 border border-gray-700 text-gray-100"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <>
                <ReportChartRenderer content={message.content} />
                <ReactMarkdown 
                  className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    code: ({ inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="relative group/code my-3">
                          <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 overflow-x-auto">
                            <code className={className} {...props}>{children}</code>
                          </pre>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/code:opacity-100 bg-gray-900 hover:bg-gray-800 border border-gray-800"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              toast.success('Código copiado');
                            }}
                          >
                            <Copy className="h-3 w-3 text-gray-400" />
                          </Button>
                        </div>
                      ) : (
                        <code className="px-1.5 py-0.5 rounded bg-gray-700 text-violet-300 text-xs font-mono">
                          {children}
                        </code>
                      );
                    },
                    a: ({ children, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">
                        {children}
                      </a>
                    ),
                    p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-bold my-3 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold my-3 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold my-2 text-violet-300">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-semibold my-2 text-gray-300">{children}</h4>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-violet-500 bg-violet-500/10 pl-4 py-2 my-3 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="my-3 overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-700 rounded-lg">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gray-800">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-700 px-3 py-2 text-left text-xs font-semibold text-violet-400">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-700 px-3 py-2 text-sm">
                        {children}
                      </td>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-violet-300">{children}</em>
                    ),
                    hr: () => <hr className="my-4 border-gray-700" />
                  }}
                >
                  {message.content}
                  </ReactMarkdown>
                  </>
                  )}
                  </div>
                  )}
        
        {message.tool_calls?.length > 0 && !message.content && (
          <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700">
            <span className="text-sm text-gray-400">Pensando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
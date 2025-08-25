
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MarkdownRenderer } from './chat/MarkdownRenderer';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatMessageProps {
  message: Message;
  onSourceLinkClick?: (payload: { href: string; alias?: string }) => void;
}

export const ChatMessage = ({ message, onSourceLinkClick }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant';
  const { toast } = useToast();
  const formattedTime = format(new Date(message.timestamp), 'MMM d, yyyy h:mm a');
  const assistantName = window.env?.VITE_ASSISTANT_NAME || import.meta.env.VITE_ASSISTANT_NAME || "Viveka";

  const handleCopy = async () => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.content;
      
      const cleanText = tempDiv.innerText
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      await navigator.clipboard.writeText(cleanText);
      
      toast({
        description: "Message copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        description: "Failed to copy text",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleMarkdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (!href) return;

    // Intercept only source links that carry ?q= (text to highlight)
    try {
      const url = new URL(href);
      if (url.searchParams.has('q') && onSourceLinkClick) {
        e.preventDefault();
        onSourceLinkClick({
          href,
          alias: anchor.textContent?.trim() || undefined,
        });
      }
    } catch {
      // Invalid/relative URL — let the browser handle it normally
    }
  };

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in transform transition-all duration-300 group",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 transition-all duration-200 backdrop-blur-sm hover:-translate-y-1 relative",
          isAssistant
            ? "bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 border border-blue-100/50 dark:border-blue-800/30"
            : "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 text-slate-900 dark:text-white border border-violet-200/50 dark:border-violet-700/30"
        )}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          boxShadow: isAssistant 
            ? '0 4px 6px -1px rgba(148, 163, 184, 0.2), 0 2px 4px -1px rgba(148, 163, 184, 0.1), 0 8px 24px -4px rgba(148, 163, 184, 0.15)'
            : '0 4px 6px -1px rgba(139, 92, 246, 0.15), 0 2px 4px -1px rgba(139, 92, 246, 0.1), 0 8px 24px -4px rgba(139, 92, 246, 0.15)'
        }}
      >
        {isAssistant && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <span className="text-white text-sm font-bold">ॐ</span>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {assistantName}
            </span>
          </div>
        )}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {message.imageData && (
            <div className="mb-2">
              <Dialog>
                <DialogTrigger asChild>
                  <img
                    src={`data:${message.imageData.mimeType};base64,${message.imageData.data}`}
                    alt={message.imageData.fileName}
                    className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-auto">
                  <img
                    src={`data:${message.imageData.mimeType};base64,${message.imageData.data}`}
                    alt={message.imageData.fileName}
                    className="w-full h-full object-contain"
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
          <div className="overflow-x-auto">
            <div className="markdown-content break-words" onClick={handleMarkdownClick}>
              <MarkdownRenderer content={message.content} />
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {formattedTime}
            </span>
            {message.isStreaming && (
              <div className="flex items-center gap-1 text-xs text-blue-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>готовлю ответ...</span>
              </div>
            )}
          </div>
          {isAssistant && !message.isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={handleCopy}
            >
              <Copy className="mr-2 h-4 w-4" />
              Копировать
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

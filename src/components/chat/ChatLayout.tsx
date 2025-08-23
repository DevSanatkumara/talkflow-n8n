
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatSession } from "@/types/chat";
import { useState, useCallback, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SourcePanel } from "@/components/chat/SourcePanel";
import { fetchWithTimeout, FETCH_TIMEOUT } from "@/utils/fetchWithTimeout";

interface ChatLayoutProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isLoading: boolean;
  isTyping: boolean;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onSendMessage: (message: string, file?: File) => void;
}

export const ChatLayout = ({
  sessions,
  currentSessionId,
  isLoading,
  isTyping,
  onNewChat,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onSendMessage,
}: ChatLayoutProps) => {
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Source panel state
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceContent, setSourceContent] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string>("Source");
  const [sourceTargetText, setSourceTargetText] = useState<string | null>(null);
  const sourceCacheRef = useRef<Map<string, string>>(new Map());
  
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleSend = useCallback(async (e: React.FormEvent, file?: File): Promise<boolean> => {
    e.preventDefault();
    
    if (!input.trim() && !file) {
      toast({
        description: "Please enter a message or attach an image",
        variant: "destructive",
      });
      return false;
    }

    try {
      await onSendMessage(input, file);
      setInput("");
      return true;
    } catch (error) {
      toast({
        description: "Failed to send message",
        variant: "destructive",
      });
      return false;
    }
  }, [input, onSendMessage, toast]);

  const handleImageSelect = useCallback((file: File) => {
    console.log('Image selected:', file.name);
  }, []);

  const handleSessionClick = useCallback((sessionId: string) => {
    onSessionSelect(sessionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, onSessionSelect]);

  const handleSourceLinkClick = useCallback(async ({ href, alias }: { href: string; alias?: string }) => {
    try {
      const url = new URL(href, window.location.href);
      const targetText = url.searchParams.get('q');
      // Keep all params except q (q is only for frontend highlight logic)
      if (url.searchParams.has('q')) {
        url.searchParams.delete('q');
      }
      const fetchUrl = url.toString();

      // Derive a readable title
      const derivedTitle = alias || decodeURIComponent((url.pathname.split('/').pop() || 'Source'));
      setSourceTitle(derivedTitle);
      setSourceTargetText(targetText);
      setIsSourceOpen(true);
      setSourceLoading(true);

      // Serve from cache if available
      const cached = sourceCacheRef.current.get(fetchUrl);
      if (cached) {
        setSourceContent(cached);
        setSourceLoading(false);
        return;
      }

      const response = await fetchWithTimeout(fetchUrl, { method: 'GET' }, FETCH_TIMEOUT);
      const text = await response.text();
      sourceCacheRef.current.set(fetchUrl, text);
      setSourceContent(text);
    } catch (err) {
      console.error('Failed to load source:', err);
      setSourceContent(null);
      toast({
        description: "Не удалось загрузить источник",
        variant: "destructive",
      });
    } finally {
      setSourceLoading(false);
    }
  }, [toast]);

  return (
    <div className="flex h-[100dvh] relative">
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isSidebarOpen={isSidebarOpen}
        onNewChat={onNewChat}
        onSessionSelect={handleSessionClick}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        onToggleFavorite={onToggleFavorite}
      />

      <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
        {currentSession && (
          <>
            <div className="flex-1 min-h-0">
              <ChatMessages messages={currentSession.messages} isTyping={isTyping} onSourceLinkClick={handleSourceLinkClick} />
            </div>
            <div className="w-full">
              <ChatInput
                input={input}
                isLoading={isLoading}
                onInputChange={setInput}
                onSend={handleSend}
                onImageSelect={handleImageSelect}
              />
            </div>
          </>
        )}
      </div>

      <SourcePanel
        open={isSourceOpen}
        onOpenChange={setIsSourceOpen}
        title={sourceTitle}
        loading={sourceLoading}
        content={sourceContent || ''}
        targetText={sourceTargetText || null}
      />

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSession } from "@/types/chat";
import { MessageSquare, PlusCircle, Trash2, Pencil, Check, X, Star, Code } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isSidebarOpen: boolean;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
}

export const ChatSidebar = ({
  sessions,
  currentSessionId,
  isSidebarOpen,
  onNewChat,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
}: ChatSidebarProps) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { currentUser } = useAuthContext();
  const { logOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate('/sign-in');
  };

  const getFirstMessage = (messages: ChatSession["messages"]) => {
    const userMessage = messages.find(m => m.role === "user");
    return userMessage ? userMessage.content : "Новый чат";
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const session = sessions.find(s => s.id === sessionId);
    
    if (session?.favorite) {
      toast.error("Не могу удалить избранный чат");
      return;
    }
    
    if (sessions.length === 1) {
      toast.error("Не могу удалить единственный чат");
      return;
    }
    onDeleteSession(sessionId);
    toast.success("Чат успешно удален");
  };

  const handleToggleFavorite = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onToggleFavorite(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    toast.success(session?.favorite ? "Чат удален из избранных" : "Чат добавлен в избранные");
  };

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name || getFirstMessage(session.messages));
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSessionId && editingName.trim()) {
      onRenameSession(editingSessionId, editingName.trim());
      setEditingSessionId(null);
      toast.success("Чат успешно переименован");
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  return (
    <div
      className={cn(
        "w-72 border-r bg-sidebar flex flex-col absolute md:relative z-40 h-full transition-transform duration-200 ease-in-out",
        !isSidebarOpen && "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="p-4 border-b flex flex-col gap-4">
        <Button onClick={onNewChat} className="w-full flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
           Новый чат
        </Button>
        <ThemeToggle />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className={cn(
                "w-72 text-left px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group",
                "flex items-center gap-2 text-sm relative cursor-pointer",
                session.id === currentSessionId && "bg-sidebar-accent"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="truncate flex-1">
                {editingSessionId === session.id ? (
                  <form onSubmit={handleRename} onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      className="h-6 text-sm"
                      autoFocus
                    />
                    <Button type="submit" size="icon" variant="ghost" className="h-6 w-6">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditing}>
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="font-medium truncate">
                      {session.name || getFirstMessage(session.messages)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(session.lastUpdated, 'MMM d, h:mm a')}
                    </div>
                  </>
                )}
              </div>
              {editingSessionId !== session.id && (
                <div className="opacity-0 group-hover:opacity-100 absolute right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6",
                      session.favorite && "text-yellow-500 opacity-100"
                    )}
                    onClick={(e) => handleToggleFavorite(e, session.id)}
                  >
                    <Star className="h-3 w-3" fill={session.favorite ? "currentColor" : "none"} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => startEditing(e, session)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => handleDelete(e, session.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{currentUser.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
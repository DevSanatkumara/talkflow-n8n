import React, { useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SourcePanelProps {
  open: boolean;
  title?: string;
  loading?: boolean;
  content?: string | null;
  targetText?: string | null;
  onOpenChange: (open: boolean) => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  open,
  title = 'Source',
  loading = false,
  content = '',
  targetText,
  onOpenChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = containerRef.current;
    if (!root) return;

    // Clear previous highlights
    root.querySelectorAll('mark[data-source-highlight="1"]').forEach((el) => {
      const m = el as HTMLElement;
      const parent = m.parentNode;
      if (!parent) return;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
    });

    if (!targetText || !content) return;
    const normalizedTarget = targetText.trim();
    if (!normalizedTarget) return;

    // Find and highlight the first occurrence of targetText (case-insensitive)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const lowerTarget = normalizedTarget.toLowerCase();
    let found = false;

    while (!found) {
      const node = walker.nextNode() as Text | null;
      if (!node) break;

      const text = node.nodeValue || '';
      const idx = text.toLowerCase().indexOf(lowerTarget);
      if (idx >= 0) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + normalizedTarget.length);

        const mark = document.createElement('mark');
        mark.setAttribute('data-source-highlight', '1');
        mark.className = 'bg-yellow-200 dark:bg-yellow-700 rounded px-0.5';

        try {
          range.surroundContents(mark);
          mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch {
          // If surroundContents fails due to split nodes, skip silently
        }

        found = true;
      }
    }
  }, [open, content, targetText]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 w-[92vw] sm:w-[540px] md:w-[800px]">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="truncate" title={title}>
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="h-full">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading source...</div>
          ) : content ? (
            <ScrollArea className="h-[calc(100dvh-64px)] p-4">
              <div ref={containerRef} className="prose dark:prose-invert max-w-none">
                <MarkdownRenderer content={content} />
              </div>
            </ScrollArea>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No content</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
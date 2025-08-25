import React, { useEffect, useState, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AnimatedStreamingTextProps {
  content: string;
  isStreaming: boolean;
  typingSpeed?: number; // символов в секунду
}

export const AnimatedStreamingText: React.FC<AnimatedStreamingTextProps> = ({
  content,
  isStreaming,
  typingSpeed = 30 // 30 символов в секунду по умолчанию
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const currentIndexRef = useRef(0);
  const targetContentRef = useRef('');

  // Обновляем целевой контент когда приходят новые данные
  useEffect(() => {
    targetContentRef.current = content;
    
    // Если это первый контент или мы еще печатаем, запускаем анимацию
    if (content && isStreaming) {
      setIsTyping(true);
      startTypingAnimation();
    }
  }, [content]);

  // Останавливаем печатание когда поток завершается
  useEffect(() => {
    if (!isStreaming && targetContentRef.current) {
      // Показываем весь оставшийся контент сразу
      setDisplayedContent(targetContentRef.current);
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [isStreaming]);

  // Сброс состояния при изменении потока
  useEffect(() => {
    if (isStreaming && !content) {
      setDisplayedContent('');
      setIsTyping(false);
      currentIndexRef.current = 0;
    }
  }, [isStreaming]);

  const startTypingAnimation = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const typeNextCharacter = () => {
      const targetContent = targetContentRef.current;
      const currentIndex = currentIndexRef.current;

      if (currentIndex < targetContent.length) {
        const nextIndex = currentIndex + 1;
        currentIndexRef.current = nextIndex;
        setDisplayedContent(targetContent.slice(0, nextIndex));
        
        // Планируем следующий символ
        const delay = 1000 / typingSpeed; // миллисекунды между символами
        typingTimeoutRef.current = setTimeout(typeNextCharacter, delay);
      } else {
        // Печатание завершено
        setIsTyping(false);
      }
    };

    typeNextCharacter();
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Если не в процессе потоковой передачи, показываем обычный рендеринг
  if (!isStreaming) {
    return <MarkdownRenderer content={content} />;
  }

  // Если контент пустой, показываем индикатор подготовки
  if (!displayedContent && !content) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-blue-500 text-sm">исследую источники</span>
        <span className="typing-cursor">|</span>
      </div>
    );
  }

  // Проверяем, есть ли markdown в отображаемом контенте
  const hasMarkdown = /```|#{1,6}\s|\*\*|\*|__|_|\[.*\]\(.*\)|`[^`]+`/.test(displayedContent);
  
  if (hasMarkdown) {
    // Для markdown контента используем обычный рендеринг
    return (
      <div className="typewriter-container">
        <MarkdownRenderer content={displayedContent} />
        {isTyping && <span className="typing-cursor ml-1">|</span>}
      </div>
    );
  }

  // Для простого текста показываем с эффектом печатающей машинки
  return (
    <div className="typewriter-container">
      <span className="typewriter-text">
        {displayedContent}
      </span>
      {isTyping && <span className="typing-cursor">|</span>}
    </div>
  );
};
export interface N8nStreamEvent {
  type: 'begin' | 'item' | 'end';
  content?: string;
  metadata?: {
    nodeId?: string;
    nodeName?: string;
    itemIndex?: number;
    runIndex?: number;
    timestamp?: number;
  };
}

export interface StreamReaderCallbacks {
  onBegin?: (event: N8nStreamEvent) => void;
  onItem?: (event: N8nStreamEvent) => void;
  onEnd?: (event: N8nStreamEvent) => void;
  onError?: (error: Error) => void;
}

/**
 * Читает потоковый ответ от n8n webhook в формате NDJSON
 * @param response - Response объект от fetch
 * @param callbacks - Колбэки для обработки событий потока
 * @returns Promise<string> - полный накопленный контент
 */
export async function readN8nStream(
  response: Response,
  callbacks: StreamReaderCallbacks = {}
): Promise<string> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedContent = '';

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      // Декодируем полученные байты в строку
      buffer += decoder.decode(value, { stream: true });
      
      // Разбиваем по строкам (NDJSON формат)
      const lines = buffer.split('\n');
      
      // Сохраняем последнюю неполную строку в буфере
      buffer = lines.pop() || '';

      // Обрабатываем каждую полную строку
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        try {
          const event = JSON.parse(trimmedLine) as N8nStreamEvent;
          
          // Обрабатываем события по типам
          switch (event.type) {
            case 'begin':
              console.log('n8n stream начался:', event.metadata);
              callbacks.onBegin?.(event);
              break;
              
            case 'item':
              if (event.content) {
                accumulatedContent += event.content;
                console.log('Получена часть контента:', event.content.substring(0, 50) + '...');
                callbacks.onItem?.(event);
              }
              break;
              
            case 'end':
              console.log('n8n stream завершился:', event.metadata);
              callbacks.onEnd?.(event);
              break;
              
            default:
              console.warn('Неизвестный тип события n8n stream:', event);
          }
        } catch (parseError) {
          console.warn('Ошибка парсинга строки NDJSON:', trimmedLine, parseError);
          callbacks.onError?.(new Error(`Parse error: ${parseError}`));
        }
      }
    }
  } catch (streamError) {
    console.error('Ошибка чтения потока:', streamError);
    callbacks.onError?.(streamError as Error);
    throw streamError;
  } finally {
    reader.releaseLock();
  }

  return accumulatedContent;
}

/**
 * Упрощённая версия для быстрого чтения потока с колбэком на каждое обновление контента
 * @param response - Response объект от fetch
 * @param onContentUpdate - Колбэк, вызываемый при каждом обновлении контента
 * @returns Promise<string> - полный накопленный контент
 */
export async function readN8nStreamSimple(
  response: Response,
  onContentUpdate: (content: string) => void
): Promise<string> {
  let accumulatedContent = '';

  await readN8nStream(response, {
    onItem: (event) => {
      if (event.content) {
        accumulatedContent += event.content;
        onContentUpdate(accumulatedContent);
      }
    },
    onError: (error) => {
      console.error('Ошибка потокового чтения:', error);
    }
  });

  return accumulatedContent;
}
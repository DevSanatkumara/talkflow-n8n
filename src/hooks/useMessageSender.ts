
import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Message } from '@/types/chat';
import { fetchWithTimeout, FETCH_TIMEOUT } from '@/utils/fetchWithTimeout';
import { extractResponseContent } from '@/utils/responseHandler';
import { QueryClient } from '@tanstack/react-query';
import { handleApiResponse, handleApiError } from '@/utils/apiResponseHandler';
import { prepareFileData } from '@/utils/fileOperations';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { readN8nStreamSimple } from '@/utils/streamReader';

export const useMessageSender = (
  updateSession: (sessionId: string, messages: Message[]) => void,
  queryClient: QueryClient
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { currentUser } = useAuthContext();
  const sendMessage = async (
    input: string,
    sessionId: string,
    currentMessages: Message[],
    file?: File
  ) => {
    const effectiveWebhookUrl = window.env?.VITE_N8N_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL;
    const username = window.env?.VITE_N8N_WEBHOOK_USERNAME || import.meta.env.VITE_N8N_WEBHOOK_USERNAME;
    const secret = window.env?.VITE_N8N_WEBHOOK_SECRET || import.meta.env.VITE_N8N_WEBHOOK_SECRET;
    const userEmail = currentUser?.email

    if (!effectiveWebhookUrl) {
      toast.error("Configuration error: No webhook URL available");
      return false;
    }

    try {
      setIsLoading(true);
      setIsTyping(true);

      console.log('Processing file for message:', file ? {
        name: file.name,
        type: file.type,
        size: file.size
      } : 'No file');

      const fileData = file ? await prepareFileData(file) : null;

      console.log('File data prepared:', fileData ? 'Successfully processed' : 'No file data');

      const userMessage: Message = {
        id: uuidv4(),
        content: input,
        role: "user",
        timestamp: Date.now(),
        ...(fileData && { imageData: fileData })
      };

      const newMessages = [...currentMessages, userMessage];
      updateSession(sessionId, newMessages);
      queryClient.setQueryData(['chatSessions', sessionId], newMessages);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (username && secret) {
        const authString = `${username}:${secret}`;
        const base64Auth = btoa(authString);
        headers['Authorization'] = `Basic ${base64Auth}`;
      }

      console.log('Sending message to webhook:', {
        url: effectiveWebhookUrl.split('/webhook/')[0] + '/webhook/[WEBHOOK_ID]',
        hasAuth: !!username && !!secret,
        hasFile: !!fileData
      });

      const response = await fetchWithTimeout(
        effectiveWebhookUrl,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            chatInput: input,
            sessionId: sessionId,
            userEmail: userEmail,
            ...(fileData && {
              data: fileData.data,
              mimeType: fileData.mimeType,
              fileName: fileData.fileName
            })
          }),
        },
        FETCH_TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Создаем сообщение ассистента с индикатором потока
      const assistantMessage: Message = {
        id: uuidv4(),
        content: '',
        role: "assistant",
        timestamp: Date.now(),
        isStreaming: true,
      };

      // Добавляем пустое сообщение ассистента для начала потокового вывода
      const messagesWithAssistant = [...newMessages, assistantMessage];
      updateSession(sessionId, messagesWithAssistant);
      queryClient.setQueryData(['chatSessions', sessionId], messagesWithAssistant);

      // Обрабатываем потоковый ответ от n8n
      try {
        const finalContent = await readN8nStreamSimple(response, (partialContent) => {
          // Обновляем контент сообщения в реальном времени, сохраняя статус потока
          const streamingMessage: Message = {
            ...assistantMessage,
            content: partialContent,
            isStreaming: true,
          };
          const updatedMessages = [...newMessages, streamingMessage];
          updateSession(sessionId, updatedMessages);
          queryClient.setQueryData(['chatSessions', sessionId], updatedMessages);
        });

        // Финальное обновление - убираем индикатор потока
        const finalMessage: Message = {
          ...assistantMessage,
          content: finalContent,
          isStreaming: false,
        };
        const finalMessages = [...newMessages, finalMessage];
        updateSession(sessionId, finalMessages);
        queryClient.setQueryData(['chatSessions', sessionId], finalMessages);
      } catch (streamError) {
        console.error('Ошибка потокового чтения:', streamError);
        
        // Если потоковое чтение не удалось, попробуем обычный способ
        const responseData = await handleApiResponse(response);
        const responseContent = extractResponseContent(responseData);
        
        const fallbackMessage: Message = {
          ...assistantMessage,
          content: responseContent || 'Ошибка получения ответа от сервера',
          isStreaming: false,
        };
        const fallbackMessages = [...newMessages, fallbackMessage];
        updateSession(sessionId, fallbackMessages);
        queryClient.setQueryData(['chatSessions', sessionId], fallbackMessages);
      }
      
      console.log('Message sent successfully');
      return true;
    } catch (error) {
      console.error('Error in webhook request:', error);
      toast.error("Failed to send message. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return {
    sendMessage,
    isLoading,
    isTyping
  };
};

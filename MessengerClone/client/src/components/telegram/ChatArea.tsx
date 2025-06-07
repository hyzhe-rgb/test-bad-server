
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Video, MoreVertical, ArrowLeft, User } from "lucide-react";
import MessageInput from "./MessageInput";
import { formatTime } from "@/lib/telegram-utils";
import { useTelegram } from "@/hooks/useTelegram";
import { useToast } from "@/hooks/use-toast";

interface ChatAreaProps {
  currentChat: any;
  onStartCall: (type: "voice" | "video") => void;
  onBack?: () => void;
  onShowProfile?: (user: any) => void;
}

export default function ChatArea({ currentChat, onStartCall, onBack, onShowProfile }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useTelegram();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const chatId = currentChat?.id?.toString().startsWith('user-') ? 
    null : currentChat?.id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
    refetchInterval: 1000, // Poll for new messages every second
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const sessionId = localStorage.getItem("telegram_session");
      if (!sessionId) {
        throw new Error("Нет активной сессии");
      }

      if (!currentChat?.id) {
        throw new Error("Чат не выбран");
      }

      const response = await fetch(`/api/chats/${currentChat.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ 
          content: content.trim(),
          messageType: "text"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не удалось отправить сообщение");
      }
      
      return response.json();
    },
    onSuccess: (newMessage) => {
      // Обновляем список сообщений
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${currentChat.id}/messages`] });
      
      // Прокручиваем вниз
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      toast({
        title: "Сообщение отправлено",
        description: "Ваше сообщение было доставлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!currentChat || !content.trim()) {
      toast({
        title: "Ошибка",
        description: "Выберите чат и введите сообщение",
        variant: "destructive",
      });
      return;
    }
    sendMessage.mutate(content);
  };

  const getAvatarFallback = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleHeaderClick = () => {
    if (currentChat && onShowProfile) {
      onShowProfile(currentChat);
    }
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center telegram-chat-bg">
        <div className="text-center">
          <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.789L24 5.562c.321-1.288-.492-1.858-1.335-1.845z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Добро пожаловать в Quickgram
          </h2>
          <p className="text-white text-opacity-80">
            Выберите чат, чтобы начать общение
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col telegram-chat-bg">
      {/* Chat Header */}
      <div className="h-14 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="sm:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
            onClick={handleHeaderClick}
          >
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentChat.avatar} alt={currentChat.name} />
                <AvatarFallback className="telegram-blue text-white">
                  {getAvatarFallback(currentChat.name)}
                </AvatarFallback>
              </Avatar>
              {currentChat.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 telegram-green rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
            </div>
            <div>
              <h2 className="font-medium text-gray-900 dark:text-white">
                {currentChat.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentChat.isOnline ? "в сети" : "был(а) недавно"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStartCall("voice")}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStartCall("video")}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages-area">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <p className="text-white text-opacity-70">Начните общение</p>
            </div>
          </div>
        ) : (
          messages.map((message: any, index: number) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"} message-animation`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 ${
                  message.senderId === user?.id
                    ? "chat-bubble-sent text-white"
                    : "chat-bubble-received text-gray-800 dark:text-white"
                }`}
              >
                {message.senderId !== user?.id && (
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    {message.sender?.firstName || 'Пользователь'}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-70 mt-2 text-right">
                  {new Date(message.createdAt).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sendMessage.isPending || !currentChat}
      />
    </div>
  );
}

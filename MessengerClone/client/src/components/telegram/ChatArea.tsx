import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import MessageInput from "./MessageInput";
import { formatTime } from "@/lib/telegram-utils";
import { useTelegram } from "@/hooks/useTelegram";

interface ChatAreaProps {
  currentChat: any;
  onStartCall: (type: "voice" | "video") => void;
  onBack?: () => void;
}

export default function ChatArea({ currentChat, onStartCall, onBack }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useTelegram();
  const queryClient = useQueryClient();

  // For direct messages with users, create or get existing chat
  const createOrGetChatMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("telegram_session")}`,
        },
        body: JSON.stringify({
          type: "private",
          name: `Direct Chat`,
          participants: [userId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      return response.json();
    },
  });

  const chatId = currentChat?.id?.toString().startsWith('user-') ? 
    null : currentChat?.id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chats", chatId, "messages"],
    enabled: !!chatId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const sessionId = localStorage.getItem("telegram_session");
      if (!sessionId) {
        throw new Error("No session found");
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
        throw new Error(errorData.message || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: (newMessage) => {
      // Immediately update the messages list
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${currentChat.id}/messages`] });

      // Scroll to bottom
      setTimeout(() => {
        const messagesContainer = document.querySelector('[data-messages-container]');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Ошибка отправки",
        description: error.message,
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
    if (!currentChat || !content.trim()) return;
    sendMessage.mutate(content);
  };

  const getAvatarFallback = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-32 h-32 telegram-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-16 h-16 telegram-blue text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.789L24 5.562c.321-1.288-.492-1.858-1.335-1.845z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Добро пожаловать в Telegram
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Выберите чат, чтобы начать общение
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="h-12 sm:h-14 px-2 sm:px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2 sm:space-x-3">
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
          <div className="relative">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarImage src={currentChat.avatar} alt={currentChat.name} />
              <AvatarFallback className="telegram-blue text-white text-xs sm:text-sm">
                {getAvatarFallback(currentChat.name)}
              </AvatarFallback>
            </Avatar>
            {currentChat.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 telegram-green rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>
          <div>
            <h2 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
              {currentChat.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentChat.isOnline ? "в сети" : "был(а) недавно"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStartCall("voice")}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStartCall("video")}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10"
          >
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10"
          >
            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 sm:pb-4" 
        data-messages-container
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Начните общение
          </div>
        ) : (
          messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"} message-animation`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
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
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendMessage.isPending || !currentChat}
        />
      </div>
    </div>
  );
}
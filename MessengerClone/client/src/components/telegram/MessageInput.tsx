
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Smile } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input-container">
      <div className="flex items-end space-x-2 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-blue-500 shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 relative">
          <Textarea
            placeholder="Написать сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            className="resize-none border-gray-300 dark:border-gray-600 rounded-2xl pr-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-32"
            disabled={disabled}
            style={{ 
              height: 'auto',
              minHeight: '40px',
              maxHeight: '128px'
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="telegram-blue hover:telegram-light-blue text-white rounded-full p-2 h-10 w-10 transition-all duration-200 transform hover:scale-105 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

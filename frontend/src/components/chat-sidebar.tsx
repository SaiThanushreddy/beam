import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sender } from "../../src/types/messages";

interface ChatSidebarProps {
  sidebarWidth: number;
  messages: any[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  isConnected: boolean;
  iframeReady: boolean;
}

const ChatSidebar = ({
  sidebarWidth,
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  isConnected,
  iframeReady,
}: ChatSidebarProps) => {
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    console.log("💬 ChatSidebar: Props changed", {
      sidebarWidth,
      messageCount: messages.length,
      hasInput: !!inputValue,
      isConnected,
      iframeReady,
    });
  }, [sidebarWidth, messages.length, inputValue, isConnected, iframeReady]);

  useEffect(() => {
    console.log("💬 ChatSidebar: Messages updated", {
      count: messages.length,
      messages: messages.map(m => ({
        type: m.type,
        sender: m.data?.sender,
        text: m.data?.text?.substring(0, 50) + "...",
        isStreaming: m.data?.isStreaming,
      }))
    });
  }, [messages]);

  const containerVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const filteredMessages = (messages || [])
    .filter((msg) => {
      return (
        (msg.data?.text &&
          typeof msg.data.text === "string" &&
          msg.data.text.trim()) ||
        ["init", "update_in_progress", "update_completed", "error"].includes(
          msg.type
        )
      );
    })
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col bg-transparent"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative bg-rose-900 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 font-heading">Beam Assistant</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isConnected && iframeReady ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500">
                {isConnected && iframeReady ? 'Online' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div
        ref={chatHistoryRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="relative bg-rose-900 p-6 rounded-full mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-heading">
                  Waiting for connection...
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Once connected, you can start building your dream website.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const key = msg.id || `msg-${index}-${msg.timestamp || Date.now()}`;
            const isUser = msg.data.sender === Sender.USER;

            return (
              <motion.div
                key={key}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isUser 
                    ? "bg-rose-900" 
                    : "bg-gray-200"
                }`}>
                  {isUser ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex-1 ${isUser ? "flex justify-end" : ""}`}>
                  <div
                    className={`inline-block max-w-[85%] p-3 rounded-xl shadow-sm ${
                      isUser
                        ? "bg-rose-900 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.data.text}
                    </p>
                    
                    {/* Streaming Indicator */}
                    {msg.data.isStreaming && (
                      <div className="flex gap-1 mt-2">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                            animate={{ 
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5] 
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-[10px] text-gray-400 mt-1 px-1 ${isUser ? "text-right" : ""}`}>
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="relative">
          <Input
            placeholder={isConnected && iframeReady ? "Tell me what to build..." : "Connecting..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isConnected || !iframeReady}
            className="w-full pr-12 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all rounded-lg h-12"
          />
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !iframeReady || !inputValue.trim()}
              className="bg-rose-900 hover:bg-rose-700 text-white transition-all duration-200 rounded-md h-8 w-8 p-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </motion.div>
  );
};

export default ChatSidebar;
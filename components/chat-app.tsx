"use client";


import { ArrowUp, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./markdown-renderer";

const CHAT_MESSAGES_STORAGE_KEY = "il_chat_messages";

const ChatApp = () => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = typeof window !== "undefined" ? localStorage.getItem("il_user_id") : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages from localStorage on component mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing chat from localStorage:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const nextMessages = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, userId }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      // Add assistant message placeholder
      const assistantMessage = { role: "assistant", content: "" };
      setMessages([...nextMessages, assistantMessage]);
      setIsThinking(false);

      // Read the stream
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                content += parsed.choices[0].delta.content;
                setMessages([...nextMessages, { role: "assistant", content }]);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (e) {
      setIsThinking(false);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border border-white rounded-lg p-2 sm:p-3 h-full flex flex-col gap-2 items-center justify-center relative z-10">
      {messages.length > 0 && (
        <div className="w-full max-w-4xl flex justify-end mb-2">
          <button
            onClick={clearChat}
            className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-all"
            title="Clear chat history"
          >
            <Trash2 className="w-3 h-3" />
            Clear Chat
          </button>
        </div>
      )}
      <div className={`${messages.length > 0 ? 'h-[80%]' : 'h-[85%]'} w-full max-w-5xl overflow-y-auto space-y-3 sleek-scrollbar p-4`}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={
              m.role === "user"
                ? "text-right mt-10"
                : "text-left mt-10"
            }
          >
            <span className="text-xs opacity-70 mr-2">{m.role}</span>
            <MarkdownRenderer content={m.content} className="leading-8"/>
          </div>
        ))}
        {isThinking && (
          <div className="text-left mt-10">
            <span className="text-xs opacity-70 mr-2">assistant</span>
            <div className="inline-flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm opacity-70 ml-2">thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center justify-center w-full gap-2">
        <input
          type="text"
          className="w-full md:w-2/3 border border-white rounded-lg p-1 sm:p-3"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="bg-white text-black p-1 sm:p-3 rounded-full disabled:opacity-60"
          onClick={handleSend}
          disabled={isSending}
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatApp;

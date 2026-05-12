'use client';

import React, { useState, useRef, useEffect, ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiAction } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MarkdownComponents = {
  p: ({ children }: ComponentPropsWithoutRef<'p'>) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: ComponentPropsWithoutRef<'ul'>) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
  ol: ({ children }: ComponentPropsWithoutRef<'ol'>) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
  li: ({ children }: ComponentPropsWithoutRef<'li'>) => <li className="mb-1">{children}</li>,
  strong: ({ children }: ComponentPropsWithoutRef<'strong'>) => <strong className="font-bold text-white">{children}</strong>,
  a: ({ children, href }: ComponentPropsWithoutRef<'a'>) => (
    <a href={href} className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ children }: ComponentPropsWithoutRef<'code'>) => (
    <code className="bg-gray-700 px-1 rounded text-xs font-mono">{children}</code>
  ),
};

interface ChatBubbleProps {
  onAiAction?: (action: AiAction) => void;
}

export default function ChatBubble({ onAiAction }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      let assistantContent = data.choices[0].message.content;

      // Parse for hidden actions
      const actionMatch = assistantContent.match(/<split_action>([\s\S]*?)<\/split_action>/);
      if (actionMatch && onAiAction) {
        try {
          const action = JSON.parse(actionMatch[1]);
          onAiAction(action);
          assistantContent = assistantContent.replace(/<split_action>[\s\S]*?<\/split_action>/, '').trim();
        } catch (e) {
          console.error('Failed to parse split_action:', e);
        }
      }

      const organizeMatch = assistantContent.match(/<organize_splits_action>([\s\S]*?)<\/organize_splits_action>/);
      if (organizeMatch && onAiAction) {
        try {
          const splits = JSON.parse(organizeMatch[1]);
          onAiAction({ type: 'organize_splits', splits });
          assistantContent = assistantContent.replace(/<organize_splits_action>[\s\S]*?<\/organize_splits_action>/, '').trim();
        } catch (e) {
          console.error('Failed to parse organize_splits_action:', e);
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please check if LiteLLM is running at http://localhost:4000.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-100">Friend's Legger Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-sm">Hello! I&apos;m your Friend's Legger AI assistant. Ask me anything about your accounts or transactions.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user'
                      ? 'bg-red-600 text-white rounded-br-none'
                      : 'bg-gray-800 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {m.role === 'user' ? (
                    m.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={MarkdownComponents}
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-200 p-3 rounded-2xl rounded-bl-none text-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-gray-900 text-gray-100 text-sm rounded-xl py-3 pl-4 pr-12 border border-gray-700 focus:outline-none focus:border-red-600 transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:text-red-400 disabled:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-red-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-red-700 transition-all duration-300 transform hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
}

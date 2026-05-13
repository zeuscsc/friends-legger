'use client';

import React, { useState, useRef, useEffect, ComponentPropsWithoutRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiAction, getAssistantContentFromChatResponse } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MarkdownComponents = {
  p: ({ children }: ComponentPropsWithoutRef<'p'>) => <p className="mb-4 last:mb-0">{children}</p>,
  ul: ({ children }: ComponentPropsWithoutRef<'ul'>) => <ul className="list-disc ml-5 mb-4">{children}</ul>,
  ol: ({ children }: ComponentPropsWithoutRef<'ol'>) => <ol className="list-decimal ml-5 mb-4">{children}</ol>,
  li: ({ children }: ComponentPropsWithoutRef<'li'>) => <li className="mb-2">{children}</li>,
  strong: ({ children }: ComponentPropsWithoutRef<'strong'>) => <strong className="font-bold text-zinc-900">{children}</strong>,
  a: ({ children, href }: ComponentPropsWithoutRef<'a'>) => (
    <a href={href} className="text-red-600 hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ children }: ComponentPropsWithoutRef<'code'>) => (
    <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800">{children}</code>
  ),
};

interface ChatInterfaceProps {
  onAiAction?: (action: AiAction) => void;
  isAuthenticated: boolean;
  onRequireAuth: (pendingMessage: string) => void;
  pendingMessageToResubmit?: string | null;
  onResubmitComplete?: () => void;
  wasAuthDeclined?: boolean;
}

export default function ChatInterface({ 
  onAiAction, 
  isAuthenticated, 
  onRequireAuth,
  pendingMessageToResubmit,
  onResubmitComplete,
  wasAuthDeclined = false
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = useCallback(async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const messageContent = overrideInput || input;
    if (!messageContent.trim() || isLoading) return;

    if (!overrideInput) {
      const userMessage: Message = { role: 'user', content: messageContent };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
    
    setIsLoading(true);

    try {
      const currentMessages = overrideInput 
        ? [...messages] 
        : [...messages, { role: 'user', content: messageContent } as Message];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: currentMessages,
          isAuthenticated,
          wasAuthDeclined
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to send message (${response.status})`;
        try {
          const errorPayload = (await response.json()) as { error?: string };
          if (typeof errorPayload.error === 'string' && errorPayload.error.trim()) {
            errorMessage = errorPayload.error;
          }
        } catch {
          // Ignore response parsing issues and keep fallback message.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const parsedAssistantContent = getAssistantContentFromChatResponse(data);
      if (parsedAssistantContent === null) {
        throw new Error('Invalid chat response payload');
      }

      let assistantContent = parsedAssistantContent;

      // Check for auth requirement
      if (assistantContent.includes('<require_auth />')) {
        onRequireAuth(messageContent);
        setIsLoading(false);
        return;
      }

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

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMessage = error instanceof Error
        ? `Sorry, I encountered an error: ${error.message}`
        : 'Sorry, I encountered an unexpected error. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fallbackMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, isAuthenticated, wasAuthDeclined, onAiAction, onRequireAuth]);

  // Handle auto-resubmission when coming back from auth
  useEffect(() => {
    if (pendingMessageToResubmit && !isLoading) {
      const timer = setTimeout(() => {
        handleSubmit(undefined, pendingMessageToResubmit);
        if (onResubmitComplete) {
          onResubmitComplete();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pendingMessageToResubmit, isLoading, onResubmitComplete, handleSubmit]);

  const isLanding = messages.length === 0;

  return (
    <div className="flex h-screen bg-[#FFFFFF] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Sidebar - Preplexity Style (Light) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 bg-[#F9FAFB] p-4">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <img src="/logo.webp" alt="Preplexity Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-lg tracking-tight text-zinc-900">Preplexity</span>
        </div>

        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-900 bg-zinc-200 rounded-lg text-[14px] font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg text-[14px] font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Discover
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg text-[14px] font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Library
          </button>
        </nav>

        <div className="pt-4 border-t border-zinc-200 space-y-4">
          <button className="w-full flex items-center justify-between px-3 py-2 text-zinc-500 hover:text-zinc-900 rounded-lg text-[13px] font-medium transition-colors">
            <span>Try Pro</span>
            <span className="bg-zinc-100 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider text-zinc-600">New</span>
          </button>
          <div className="px-3 py-2 flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-zinc-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-zinc-900 truncate">{isAuthenticated ? 'Chan Tai Man' : 'Sign in'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <img src="/logo.webp" alt="Preplexity Logo" className="w-5 h-5 object-contain" />
            <span className="font-bold text-base tracking-tight text-zinc-900">Preplexity</span>
          </div>
          <button className="text-zinc-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className={`max-w-3xl mx-auto px-4 md:px-0 ${isLanding ? 'h-full flex flex-col justify-center' : 'py-8 space-y-10'}`}>
            {isLanding ? (
              <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-700 -mt-20">
                <h1 className="text-[40px] md:text-[56px] font-medium text-zinc-900 tracking-tight leading-tight">
                  What do you want to know?
                </h1>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col animate-in slide-in-from-bottom-2 duration-300 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-5 h-5 bg-zinc-100 rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>
                        </div>
                        <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">Answer</span>
                      </div>
                    )}
                    <div
                      className={`max-w-full md:max-w-[90%] text-[16px] leading-[1.6] ${
                        m.role === 'user'
                          ? 'bg-zinc-100 border border-zinc-200 text-zinc-900 px-4 py-2.5 rounded-2xl mb-2'
                          : 'text-zinc-800'
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
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-5 h-5 bg-zinc-100 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      </div>
                      <span className="text-[12px] font-medium text-zinc-400 italic">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={`w-full max-w-3xl mx-auto px-4 md:px-0 pb-6 pt-4 bg-white transition-all ${isLanding ? 'mb-12' : ''}`}>
          <form onSubmit={handleSubmit} className="relative group bg-white border border-zinc-200 rounded-2xl focus-within:border-zinc-300 focus-within:ring-4 focus-within:ring-zinc-100 transition-all shadow-md">
            <div className="flex flex-col p-2 pt-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="What do you want to know?"
                className="w-full bg-transparent text-zinc-900 text-[16px] py-2 px-4 resize-none focus:outline-none min-h-[44px] max-h-[200px]"
                disabled={isLoading}
              />
              
              <div className="flex items-center justify-between px-2 pb-1 pt-2 mt-1">
                <div className="flex items-center gap-2">
                  <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg text-[13px] font-medium transition-all border border-transparent hover:border-zinc-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Focus
                  </button>
                  <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg text-[13px] font-medium transition-all border border-transparent hover:border-zinc-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Attach
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  {isAuthenticated && (
                    <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold text-green-600 uppercase tracking-widest border-r border-zinc-100 pr-4">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Auth
                    </div>
                  )}
                  {!isAuthenticated && (
                    <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-widest border-r border-zinc-100 pr-4">
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                      Pro
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </form>
          
          {!isLanding && (
            <div className="mt-4 flex justify-center gap-6 text-[11px] text-zinc-400 font-medium uppercase tracking-widest">
              <span className="hover:text-zinc-600 cursor-default transition-colors">Copilot</span>
              <span className="hover:text-zinc-600 cursor-default transition-colors">Search</span>
              <span className="hover:text-zinc-600 cursor-default transition-colors">Preplexity Gateway</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

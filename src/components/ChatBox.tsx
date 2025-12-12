'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X } from 'lucide-react';

type Message = {
  from: 'assistant' | 'user' | 'system';
  text: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: 'assistant', text: "Hi! Ask about products or say 'Compare sansung galaxy21 and samsung galaxy s22' or 'give me details about samsung galaxy s21." }
  ]);
  const [input, setInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, open]);

  // autofocus when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // click outside to close
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!open) return;
      const target = e.target as Node | null;
      if (!target) return;

      const clickedInsidePanel = panelRef.current?.contains(target);
      const clickedOnButton = buttonRef.current?.contains(target);

      if (!clickedInsidePanel && !clickedOnButton) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // esc to close globally
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setMessages(prev => [...prev, { from: 'user', text: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed })
      });
      const data = await res.json();
      if (data?.ok) {
        setMessages(prev => [...prev, { from: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { from: 'assistant', text: `Error: ${data?.error || 'Unknown error'}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { from: 'assistant', text: `Network error: ${err?.message || String(err)}` }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-4 right-6 z-50 m-1">
        <Button
          ref={buttonRef as any}
          onClick={() => setOpen(v => !v)}
          variant="default"
          className={`rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg ${open ? 'bg-neutral-900' : 'bg-black hover:bg-neutral-800'}`}
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          {!open ? <MessageSquare className="h-6 w-6 text-white" /> : <X className="h-6 w-6 text-white" />}
        </Button>
      </div>

      {/* Panel */}
      <div
        aria-hidden={!open}
        className={`fixed bottom-20 right-6 z-40 w-[360px] max-w-[92vw] transition-transform duration-200 ${
          open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
        }`}
      >
        <Card ref={panelRef as any} className="bg-neutral-950 border border-neutral-800 text-white shadow-2xl ">
          <CardHeader className="flex items-center justify-between gap-2 px-4 py-1 bg-gradient-to-r from-neutral-900 to-black">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 bg-white/5">
                {/* If you have an assistant image use <AvatarImage src="..." /> */}
                <AvatarFallback className="text-black">PA</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm text-white">Product Assistant</CardTitle>
                <CardDescription className="text-xs text-neutral-400">Ask about products or comparisons</CardDescription>
              </div>
            </div>

            {/* placeholder space (no close button) */}
            <div className="w-6" />
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[220px] bg-neutral-900 p-4" ref={chatRef as any}>
              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => {
                  const isUser = msg.from === 'user';
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <Avatar className="w-8 h-8 mr-3 bg-white/5">
                          <AvatarFallback className="text-black">A</AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[78%] px-4 py-2 rounded-lg whitespace-pre-wrap ${
                          isUser ? 'bg-blue-700 text-white' : 'bg-neutral-800 text-neutral-100'
                        }`}
                      >
                        <div className="text-xs text-neutral-400 mb-1 capitalize">{msg.from}</div>
                        <div className="text-sm">{msg.text}</div>
                      </div>

                      {isUser && (
                        <Avatar className="w-8 h-8 ml-3 bg-blue-800">
                          <AvatarFallback className="text-white">U</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="px-3 py-3 border-t border-neutral-800 bg-neutral-950">
            <div className="flex items-center gap-2 w-full">
              <Input
                ref={inputRef as any}
                placeholder="Type a message... (e.g., Tell me about Phone A)"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-neutral-800 text-white placeholder:text-neutral-500"
                disabled={sending}
              />
              <Button onClick={sendMessage} disabled={sending} className={sending ? 'bg-neutral-700' : ''}>
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

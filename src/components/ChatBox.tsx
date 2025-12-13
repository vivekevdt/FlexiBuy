"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X } from "lucide-react";

type Message = {
  from: "assistant" | "user" | "system";
  text: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "assistant",
      text: "Hi! Ask about products or say 'Compare Samsung Galaxy S21 and Samsung Galaxy S22' or 'Give me details about Samsung Galaxy S21.'",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing, open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (!open) return;
      const target = e.target as Node;

      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // -------------------------------------------------------------
  // SEND MESSAGE + SHOW TYPING INDICATOR
  // -------------------------------------------------------------
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = { from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          messages: messages.map((m) => ({
            role: m.from as "assistant" | "user" | "system",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      setTyping(false);

      if (data?.ok) {
        const assistantMsg: Message = { from: "assistant", text: data.reply };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: Message = {
          from: "assistant",
          text: "Error: " + (data.error || "Unknown error"),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setTyping(false);
      const errorMsg: Message = {
        from: "assistant",
        text: "Network error: " + err.message,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, messages]);

  // ENTER to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 right-6 z-50">
        <Button
          ref={buttonRef}
          onClick={() => setOpen((prev) => !prev)}
          className={`rounded-full w-14 h-14 flex items-center justify-center shadow-lg ${
            open ? "bg-neutral-900" : "bg-black"
          } text-white`}
        >
          {open ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Chat Panel */}
      <div
        aria-hidden={!open}
        className={`fixed bottom-20 right-6 z-40 w-[360px] max-w-[92vw] transition-all duration-200 ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`}
      >
        <Card
          ref={panelRef}
          className="bg-neutral-950 text-white border border-neutral-800 shadow-2xl"
        >
          {/* Header */}
          <CardHeader className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-neutral-900 to-black">
            <Avatar className="w-9 h-9 bg-white/5">
              <AvatarFallback className="text-black">PA</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">Product Assistant</CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Ask about products or comparisons
              </CardDescription>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="p-0">
            <ScrollArea className="h-[240px] bg-neutral-900 p-4" ref={chatRef}>
              <div className="flex flex-col gap-3">
                {/* Render messages */}
                {messages.map((msg, i) => {
                  const isUser = msg.from === "user";
                  return (
                    <div
                      key={i}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <Avatar className="w-8 h-8 mr-3 bg-white/5">
                          <AvatarFallback className="text-black">
                            A
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-lg whitespace-pre-wrap ${
                          isUser
                            ? "bg-blue-700 text-white"
                            : "bg-neutral-800 text-neutral-100"
                        }`}
                      >
                        <div className="text-xs text-neutral-400 mb-1 capitalize">
                          {msg.from}
                        </div>
                        <div className="text-sm">{msg.text}</div>
                      </div>

                      {isUser && (
                        <Avatar className="w-8 h-8 ml-3 bg-blue-800">
                          <AvatarFallback className="text-white">
                            U
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {typing && (
                  <div className="flex justify-start">
                    <Avatar className="w-8 h-8 mr-3 bg-white/5">
                      <AvatarFallback className="text-black">A</AvatarFallback>
                    </Avatar>

                    <div className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm flex gap-2 items-center">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-150">●</span>
                      <span className="animate-pulse delay-300">●</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input */}
          <CardFooter className="px-3 py-3 border-t border-neutral-800 bg-neutral-950">
            <div className="flex items-center gap-2 w-full">
              <Input
                ref={inputRef}
                value={input}
                placeholder="Type a message…"
                className="bg-neutral-800 text-white placeholder:text-neutral-500"
                disabled={sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button onClick={sendMessage} disabled={sending}>
                {sending ? "..." : "Send"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

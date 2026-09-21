"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Source = { title: string; url: string };
type ChatMessage = { role: "user" | "assistant"; text: string; sources?: Source[] };

const STORAGE_KEY = "mattia-ciuni-ai-chat";
const promptsByPath: Record<string, string[]> = {
  "/": ["Who is Mattia Ciuni?", "What is Payle?", "Show me the latest Notes"],
  "/thoughts/": ["What is Mattia building?", "Show me the latest Thought"],
  "/notes/": ["What are the Notes about?", "Show me the latest Note"],
  "/feedback/": ["What is the Feedback series?", "How do I send feedback?", "Show me the latest exchange"],
};

function initialPrompts(path: string) {
  if (promptsByPath[path]) return promptsByPath[path];
  if (path.startsWith("/thoughts/")) return ["Summarize this Thought", "Show me related Thoughts"];
  if (path.startsWith("/notes/")) return ["Summarize this Note", "Show me related Notes"];
  if (path.startsWith("/feedback/")) return ["What changed thanks to this feedback?", "Show me the Feedback index"];
  return ["Who is Mattia Ciuni?", "What is Payle?"];
}

function TypingText({ text }: { text: string }) {
  const [visible, setVisible] = useState("");

  useEffect(() => {
    let position = 0;
    const timer = window.setInterval(() => {
      position += Math.max(1, Math.ceil((text.length - position) / 35));
      setVisible(text.slice(0, position));
      if (position >= text.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [text]);

  return <>{visible}<span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-gray-1200 align-[-2px]" aria-hidden="true" /> </>;
}

export function SiteRagChat() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [path, setPath] = useState("/");

  useEffect(() => {
    setPath(window.location.pathname.replace(/\/$/, "") || "/");
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);
    } catch {
      // Storage can be disabled; the chat remains usable for the current visit.
    }
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Quota or privacy mode: do not interrupt the conversation.
    }
  }, [messages]);

  const prompts = useMemo(() => initialPrompts(path), [path]);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, path }),
      });
      const data = (await response.json()) as { answer?: string; sources?: Source[]; navigateTo?: string | null };
      if (!response.ok) throw new Error(data.answer || "The site guide is unavailable right now.");
      const answer = data.answer || "I could not find that in the site's published content.";
      setMessages((current) => [...current, { role: "assistant", text: answer, sources: data.sources }]);
      setTypingIndex(messages.length + 1);
      if (data.navigateTo) {
        window.setTimeout(() => {
          if (data.navigateTo?.startsWith("/")) window.location.assign(data.navigateTo);
          else if (data.navigateTo === "https://usepayle.com") window.location.assign(data.navigateTo);
        }, 250);
      }
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error instanceof Error ? error.message : "Something went wrong. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  function clearConversation() {
    setMessages([]);
    setTypingIndex(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* private browsing */ }
  }

  return (
    <aside className="fixed bottom-4 right-4 z-40 flex flex-col items-end sm:bottom-6 sm:right-6" aria-label="Ask Mattia Ciuni AI">
      {open && (
        <section className="mb-3 flex h-[min(720px,calc(100vh-96px))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-[0_18px_70px_rgba(0,0,0,0.16)]" aria-label="Ask Mattia Ciuni AI">
          <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <p className="font-serif text-xl leading-none">Ask Mattia Ciuni AI</p>
              <p className="mt-1 text-xs text-gray-1000">Only this site and Payle</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && <button type="button" onClick={clearConversation} className="rounded-full px-2.5 py-1.5 text-xs text-gray-1000 hover:bg-gray-200" aria-label="Start a new chat">New chat</button>}
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-2.5 py-1.5 text-xl leading-none text-gray-1000 hover:bg-gray-200" aria-label="Close chat">×</button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5" aria-live="polite">
            {!messages.length && (
              <div className="pt-8 text-center">
                <p className="font-serif text-2xl">What would you like to know?</p>
                <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-gray-1000">Ask about Mattia, Payle, the Thoughts, the Notes, the Feedback or anything else published here.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={message.role === "user" ? "max-w-[84%] rounded-2xl rounded-br-md bg-gray-1200 px-4 py-2.5 text-sm leading-relaxed text-white" : "max-w-[94%] text-[15px] leading-relaxed text-gray-1200"}>
                  {message.role === "assistant" && index === typingIndex ? <TypingText text={message.text} /> : message.text}
                  {message.sources?.length ? <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2 text-xs text-gray-1000">{message.sources.slice(0, 3).map((source) => <Link key={source.url} href={source.url} onClick={() => setOpen(false)} className="block underline decoration-gray-300 underline-offset-2 hover:text-gray-1200">Read: {source.title}</Link>)}</div> : null}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-1 text-gray-1000" aria-label="Mattia Ciuni AI is typing"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:240ms]" /></div>}
          </div>

          <div className="shrink-0 border-t border-gray-200 px-4 pb-4 pt-3">
            <div className="mb-3 flex max-w-full flex-nowrap gap-2 overflow-x-auto overscroll-x-contain whitespace-nowrap touch-pan-x pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => void ask(prompt)} className="shrink-0 rounded-full border border-gray-300 px-3 py-1.5 text-xs text-gray-1000 hover:border-gray-1200 hover:text-gray-1200">{prompt}</button>)}
            </div>
            <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 focus-within:border-gray-1200">
              <label htmlFor="site-rag-question" className="sr-only">Ask Mattia Ciuni AI a question</label>
              <input id="site-rag-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Message Mattia Ciuni AI..." maxLength={500} className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-gray-1000/60" disabled={busy} />
              <button type="submit" disabled={busy || !question.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-1200 text-sm text-white transition-opacity disabled:opacity-25" aria-label="Send message">↑</button>
            </form>
            <p className="mt-2 text-center text-[11px] text-gray-1000">Answers come from the published site.</p>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-11 items-center gap-2 rounded-full bg-gray-1200 px-4 text-sm text-white shadow-[0_5px_25px_rgba(0,0,0,0.16)] transition-opacity hover:opacity-85" aria-expanded={open} aria-controls="site-guide">
        <span>Ask Mattia Ciuni AI</span><span aria-hidden="true">↗</span>
      </button>
    </aside>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble, TypingBubble } from "./ChatBubble";
import { speak, useSpeechRecognition } from "@/hooks/useSpeech";
import {
  checkNumberRisk,
  extractPhoneNumber,
  formatAssistantReply,
  speakableReply,
} from "@/lib/checkNumberRisk";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi 👋 I can check the fraud risk of any phone number using telecom network intelligence.\nType or say a phone number to begin.",
};

export const TrustScoreChat = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleVoice = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + " " + text : text));
  }, []);

  const { listening, supported, start, stop } = useSpeechRecognition(handleVoice);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Prime voices list
  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    const phone = extractPhoneNumber(text);
    if (!phone) {
      const reply =
        "I couldn't find a phone number in your message. Try something like: \"Check 0712345678\".";
      await new Promise((r) => setTimeout(r, 600));
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
      speak(reply);
      setThinking(false);
      return;
    }

    try {
      const result = await checkNumberRisk(phone);
      const reply = formatAssistantReply(result);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
      speak(speakableReply(result));
    } catch (error) {
      const message =
        error instanceof Error
          ? `Risk check failed: ${error.message}`
          : "Something went wrong checking that number.";
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: message },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-bg">
      {/* Navbar */}
      <header className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            Trust<span className="bg-gradient-primary bg-clip-text text-transparent">Score</span>
          </span>
        </div>
        <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground md:block">
          Telecom Fraud Detection Demo
        </span>
      </header>

      {/* Chat */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:gap-6">
          {messages.map((m) => (
            <ChatBubble key={m.id} role={m.role} content={m.content} />
          ))}
          {thinking && <TypingBubble />}
        </div>
      </main>

      {/* Input bar */}
      <footer className="border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-end gap-1.5 rounded-xl border border-border bg-card p-1.5 shadow-soft focus-within:ring-2 focus-within:ring-primary/40 sm:gap-2 sm:rounded-2xl sm:p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Type or speak a phone number…"
              className="max-h-32 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none sm:px-3 sm:text-sm"
            />
            <Button
              type="button"
              size="icon"
              variant={listening ? "destructive" : "secondary"}
              onClick={listening ? stop : start}
              disabled={!supported}
              title={supported ? "Voice input" : "Speech recognition not supported"}
              className="h-10 w-10 shrink-0 rounded-lg sm:rounded-xl"
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              onClick={send}
              disabled={!input.trim() || thinking}
              className="h-10 w-10 shrink-0 rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 sm:rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-3 px-1 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            Powered by telecom network intelligence (SIM Swap, Device Status, Location Verification)
          </p>
        </div>
      </footer>
    </div>
  );
};

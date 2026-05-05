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
    } catch {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong checking that number." },
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
    <div className="flex h-screen flex-col bg-gradient-bg">
      {/* Navbar */}
      <header className="flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Trust<span className="bg-gradient-primary bg-clip-text text-transparent">Score</span>
          </span>
        </div>
        <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:block">
          Telecom Fraud Intelligence Demo
        </span>
      </header>

      {/* Chat */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {messages.map((m) => (
            <ChatBubble key={m.id} role={m.role} content={m.content} />
          ))}
          {thinking && <TypingBubble />}
        </div>
      </main>

      {/* Input bar */}
      <footer className="border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:ring-2 focus-within:ring-primary/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Type or speak a phone number…"
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button
              type="button"
              size="icon"
              variant={listening ? "destructive" : "secondary"}
              onClick={listening ? stop : start}
              disabled={!supported}
              title={supported ? "Voice input" : "Speech recognition not supported"}
              className="rounded-xl"
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              onClick={send}
              disabled={!input.trim() || thinking}
              className="rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Powered by telecom network intelligence (SIM Swap, Device Status, Number Verification, Location Verification)
          </p>
        </div>
      </footer>
    </div>
  );
};

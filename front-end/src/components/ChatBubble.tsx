import { cn } from "@/lib/utils";
import { Shield, User } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export const ChatBubble = ({ role, content }: Props) => {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft",
          isUser
            ? "rounded-tr-sm bg-gradient-primary text-primary-foreground"
            : "rounded-tl-sm bg-secondary text-foreground"
        )}
      >
        {content}
      </div>
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/90 text-background">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

export const TypingBubble = () => (
  <div className="flex w-full justify-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
      <Shield className="h-5 w-5 text-primary-foreground" />
    </div>
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 shadow-soft">
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
    </div>
  </div>
);

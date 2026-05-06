import { cn } from "@/lib/utils";
import { Shield, User } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export const ChatBubble = ({ role, content }: Props) => {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary shadow-glow sm:h-9 sm:w-9">
          <Shield className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] break-words whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed shadow-soft sm:max-w-[80%] sm:px-4 sm:py-3 sm:text-sm",
          isUser
            ? "rounded-tr-sm bg-gradient-primary text-primary-foreground"
            : "rounded-tl-sm bg-secondary text-foreground"
        )}
      >
        {content}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/90 text-background sm:h-9 sm:w-9">
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      )}
    </div>
  );
};

export const TypingBubble = () => (
  <div className="flex w-full justify-start gap-2 sm:gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary shadow-glow sm:h-9 sm:w-9">
      <Shield className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
    </div>
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-3 py-2.5 shadow-soft sm:px-4 sm:py-3">
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
    </div>
  </div>
);

"use client";

import { useEffect, useRef, useState } from "react";
import CalphyMascot from "@/components/CalphyMascot";
import ContextIndicator from "./ContextIndicator";
import Message from "./Message";
import Suggestion from "./Suggestion";
import PromptInput from "./PromptInput";

const DEFAULT_INITIAL_SUGGESTIONS = [
  "How do I go to simulations?",
  "Preview Lesson 5",
  "Convert 25°C to °F",
];

export default function Chat({
  isOpen = true,
  onClose = () => {},
  initialMessage = "Hey there! I'm Cinder 🔥, your physics learning buddy. Ask me anything about our Temperature & Heat lessons, simulations, or formulas!",
  onLinkClick = () => {},
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: initialMessage,
      suggestions: DEFAULT_INITIAL_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const abortControllerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  // Accessible keyboard shortcut: Escape closes the open panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up any in-flight stream on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll to bottom on incoming messages or token updates
  useEffect(() => {
    if (autoScroll && isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isStreaming, autoScroll, isOpen]);

  // Detect user scroll to pause/resume auto-scroll
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 40;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold;
    setAutoScroll(isNearBottom);
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages((prev) => {
      const lastIdx = prev.length - 1;
      if (lastIdx >= 0 && prev[lastIdx].isStreaming) {
        return [
          ...prev.slice(0, lastIdx),
          { ...prev[lastIdx], isStreaming: false },
        ];
      }
      return prev;
    });
  };

  const handleConfirmationResponse = (index, approved) => {
    const confirmation = messages[index]?.confirmation;
    if (!confirmation || confirmation.type !== "web-search") return;
    const url = approved
      ? `https://www.google.com/search?q=${encodeURIComponent(
          `${confirmation.query} Temperature and Heat physics`
        )}`
      : null;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setMessages((current) =>
      current.map((msg, idx) =>
        idx === index
          ? {
              ...msg,
              confirmation: null,
              externalSearchUrl: url,
              content: approved
                ? "I opened an external web search. Its results are not verified by this course."
                : "Okay, I didn’t search the web. I’ll stick to the course material.",
            }
          : msg
      )
    );
  };

  const send = async (promptValue) => {
    const question = (promptValue ?? input).trim();
    if (!question || isStreaming) return;

    setInput("");
    setAutoScroll(true);

    const newUserMsg = { role: "user", content: question };
    const newAssistantMsg = {
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newUserMsg, newAssistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages
        .slice(1)
        .slice(-8)
        .map(({ role, content, text }) => ({
          role,
          content: content || text || "",
        }));

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: question }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMsg = "Unable to reach Cinder. Please try again.";
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("No response body received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) return;
        if (trimmed === "data: [DONE]") return;
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6).trim();
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "chunk" && typeof data.text === "string") {
              setMessages((prev) => {
                const lastIdx = prev.length - 1;
                if (lastIdx < 0) return prev;
                const last = prev[lastIdx];
                return [
                  ...prev.slice(0, lastIdx),
                  {
                    ...last,
                    content: (last.content || "") + data.text,
                    isStreaming: true,
                  },
                ];
              });
            } else if (data.type === "done") {
              setMessages((prev) => {
                const lastIdx = prev.length - 1;
                if (lastIdx < 0) return prev;
                const last = prev[lastIdx];
                return [
                  ...prev.slice(0, lastIdx),
                  {
                    ...last,
                    isStreaming: false,
                    sources: data.sources || last.sources || [],
                    suggestions: data.suggestions || [],
                    confirmation: data.confirmation || null,
                    links: data.links || last.links || [],
                    notice: data.notice || last.notice || null,
                  },
                ];
              });
            } else if (data.type === "error") {
              const errNotice = data.error || "An error occurred.";
              setMessages((prev) => {
                const lastIdx = prev.length - 1;
                if (lastIdx < 0) return prev;
                const last = prev[lastIdx];
                return [
                  ...prev.slice(0, lastIdx),
                  {
                    ...last,
                    isStreaming: false,
                    content:
                      last.content ||
                      "I encountered an issue trying to answer. Please try again.",
                    notice: errNotice,
                  },
                ];
              });
            }
          } catch {
            // ignore partial JSON chunk
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          processLine(line);
        }
      }

      if (buffer.trim()) {
        processLine(buffer);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // Stream aborted on user stop
      } else {
        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (lastIdx < 0) return prev;
          const last = prev[lastIdx];
          return [
            ...prev.slice(0, lastIdx),
            {
              ...last,
              role: "assistant",
              content:
                last.content ||
                "I couldn’t reach the assistant service. Please try again in a moment.",
              isStreaming: false,
              links: [{ label: "Browse lessons", href: "/lessons" }],
              notice:
                err.message || "The request failed before it could be answered.",
            },
          ];
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && prev[lastIdx].isStreaming) {
          return [
            ...prev.slice(0, lastIdx),
            { ...prev[lastIdx], isStreaming: false },
          ];
        }
        return prev;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <section
      className="ai-chat-panel"
      aria-label="Cinder course assistant"
      aria-live="polite"
    >
      <header className="ai-chat-header">
        <div className="ai-chat-header-mascot">
          <CalphyMascot size={38} mood={isStreaming ? "think" : "wave"} />
        </div>
        <div className="ai-chat-header-info flex-grow-1">
          <div className="ai-chat-title">Cinder Assistant</div>
          <ContextIndicator
            modelName="openai/gpt-oss-120b"
            isLive={!isStreaming}
          />
        </div>
        <button
          type="button"
          className="ai-chat-close"
          aria-label="Close assistant"
          onClick={onClose}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </header>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="ai-chat-messages"
        role="log"
        aria-label="Conversation"
      >
        {messages.map((message, index) => {
          const isLatestAssistant =
            index === messages.length - 1 && message.role === "assistant";
          const showSuggestions =
            !isStreaming &&
            isLatestAssistant &&
            message.suggestions &&
            message.suggestions.length > 0;

          return (
            <div key={index} className="ai-chat-message-wrapper">
              <Message
                message={message}
                onConfirmationResponse={(approved) =>
                  handleConfirmationResponse(index, approved)
                }
                onLinkClick={onLinkClick}
              />
              {showSuggestions && (
                <div className="ai-chat-suggestions-container">
                  <Suggestion
                    suggestions={message.suggestions}
                    onSelect={(prompt) => send(prompt)}
                    disabled={isStreaming}
                  />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {!autoScroll && (
        <button
          type="button"
          className="ai-chat-scroll-bottom"
          onClick={scrollToBottom}
          title="Scroll to latest message"
          aria-label="Scroll to bottom"
        >
          <i className="bi bi-arrow-down" aria-hidden="true" />
        </button>
      )}

      <div className="ai-chat-footer">
        <PromptInput
          value={input}
          onChange={setInput}
          onSubmit={() => send(input)}
          onStop={handleStop}
          isStreaming={isStreaming}
          disabled={isStreaming}
          textareaRef={textareaRef}
        />
        <div className="ai-chat-footnote">
          Answers stay within the lessons and tools on this site.
        </div>
      </div>
    </section>
  );
}

export { Chat };

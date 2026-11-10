"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CalphyMascot from "@/components/CalphyMascot";
import Reasoning from "./Reasoning";
import Sources from "./Sources";
import Confirmation from "./Confirmation";

function normalizeMathDelimiters(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    .replace(/\\[ \t]*(\r?\n)/g, "  $1")
    .replace(/\^\\circ!?\s*([CF])/g, "{}^\\circ\\!$1");
}

function parseMessageContent(
  rawContent,
  isStreaming,
  explicitReasoning,
  isUser = false
) {
  let thought = explicitReasoning || "";
  let body = rawContent || "";
  let isReasoningStreaming = false;

  // Safeguard 2: If isUser, skip <think> parsing entirely so user content with <think> is not lost
  if (isUser) {
    return { thought: "", body: rawContent || "", isReasoningStreaming: false };
  }

  if (rawContent && typeof rawContent === "string") {
    const lower = rawContent.toLowerCase();
    const thinkStartIndex = lower.indexOf("<think>");
    // Safeguard 1: search starting from thinkStartIndex + 7 to prevent backwards slice
    const thinkEndIndex =
      thinkStartIndex !== -1
        ? lower.indexOf("</think>", thinkStartIndex + 7)
        : -1;

    if (thinkStartIndex !== -1) {
      if (thinkEndIndex !== -1) {
        // Complete thought
        const extracted = rawContent
          .slice(thinkStartIndex + 7, thinkEndIndex)
          .trim();
        thought = extracted || thought;
        const before = rawContent.slice(0, thinkStartIndex).trim();
        const after = rawContent.slice(thinkEndIndex + 8).trim();
        body = before && after ? `${before}\n\n${after}` : before || after;
        isReasoningStreaming = false;
      } else {
        // Active streaming thought
        const before = rawContent.slice(0, thinkStartIndex).trim();
        const activeThought = rawContent
          .slice(thinkStartIndex + 7)
          .trimStart();
        thought = activeThought || thought;
        body = before;
        isReasoningStreaming = isStreaming;
      }
    }
  }

  return { thought, body, isReasoningStreaming };
}

export default function Message({
  message = {},
  onConfirmationResponse = () => {},
  onLinkClick = () => {},
}) {
  const {
    role = "assistant",
    content: rawContentProp,
    text: rawTextProp,
    reasoning: explicitReasoning,
    isStreaming = false,
    sources = [],
    links = [],
    confirmation = null,
    notice = null,
    externalSearchUrl = null,
  } = message;

  const rawContent = rawContentProp ?? rawTextProp ?? "";
  const [copied, setCopied] = useState(false);

  const isUser = role === "user";

  const { thought, body, isReasoningStreaming } = parseMessageContent(
    rawContent,
    isStreaming,
    explicitReasoning,
    isUser
  );

  const handleCopy = async () => {
    if (!body) return;
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(body);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = body;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <div
      className={`ai-message ai-message-${isUser ? "user" : "assistant"}`}
      role="article"
      aria-label={`${isUser ? "User" : "Assistant"} message`}
    >
      <div className="ai-message-avatar" aria-hidden="true">
        {isUser ? (
          <div className="ai-message-avatar-user">
            <i className="bi bi-person-fill" />
          </div>
        ) : (
          <div className="ai-message-avatar-assistant">
            <CalphyMascot size={30} mood={isStreaming ? "think" : "wave"} />
          </div>
        )}
      </div>

      <div className="ai-message-content">
        {isUser ? (
          <div className="ai-message-body ai-message-user-text">
            {body || rawContent}
          </div>
        ) : (
          <>
            {/* Reasoning Drawer */}
            {(thought || isReasoningStreaming) && (
              <Reasoning
                content={thought}
                isStreaming={isReasoningStreaming}
                defaultOpen={isReasoningStreaming}
              />
            )}

            {/* Markdown Response Body */}
            {body ? (
              <div className="ai-message-body ai-message-markdown assistant-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  skipHtml
                  components={{
                    a: ({ href, children, ...props }) => {
                      const isInternal =
                        typeof href === "string" &&
                        href.startsWith("/") &&
                        !href.startsWith("//");
                      if (isInternal) {
                        return (
                          <Link href={href} onClick={onLinkClick} {...props}>
                            {children}
                          </Link>
                        );
                      }
                      return (
                        <a
                          href={href || "#"}
                          target="_blank"
                          rel="noreferrer"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                    img: ({ alt }) => <span>{alt}</span>,
                    table: ({ children, ...props }) => (
                      <div className="table-responsive">
                        <table
                          className="table table-sm assistant-markdown-table ai-message-table"
                          {...props}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                  }}
                >
                  {normalizeMathDelimiters(body)}
                </ReactMarkdown>
                {isStreaming && !isReasoningStreaming && (
                  <span className="ai-message-cursor" aria-hidden="true" />
                )}
              </div>
            ) : isStreaming && !isReasoningStreaming ? (
              <div className="ai-message-loading" role="status">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                />
                <span>Looking through the course…</span>
              </div>
            ) : null}

            {/* Notice / Context tag */}
            {notice && (
              <div className="ai-message-notice" role="status">
                <i className="bi bi-info-circle me-1" aria-hidden="true" />
                <span>{notice}</span>
              </div>
            )}

            {/* Sources */}
            {sources?.length > 0 && (
              <Sources sources={sources} onLinkClick={onLinkClick} />
            )}

            {/* External Search Link */}
            {externalSearchUrl && (
              <a
                className="ai-message-external-search"
                href={externalSearchUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>Open web search</span>
                <i className="bi bi-arrow-up-right ms-1" aria-hidden="true" />
              </a>
            )}

            {/* Suggested Link Chips */}
            {links?.length > 0 && (
              <div
                className="ai-message-links"
                role="group"
                aria-label="Related links"
              >
                {links.slice(0, 3).map((link, index) => {
                  const key = `${link.href}-${index}`;
                  const isInternal =
                    typeof link.href === "string" &&
                    link.href.startsWith("/") &&
                    !link.href.startsWith("//");

                  return isInternal ? (
                    <Link
                      key={key}
                      href={link.href}
                      onClick={onLinkClick}
                      className="ai-message-link"
                    >
                      <span>{link.label || link.title}</span>
                      <i className="bi bi-arrow-up-right ms-1" aria-hidden="true" />
                    </Link>
                  ) : (
                    <a
                      key={key}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="ai-message-link"
                    >
                      <span>{link.label || link.title}</span>
                      <i className="bi bi-arrow-up-right ms-1" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Confirmation prompt */}
            {confirmation && (
              <Confirmation
                confirmation={confirmation}
                onConfirm={onConfirmationResponse}
              />
            )}

            {/* Copy button action bar */}
            {body && !isStreaming && (
              <div className="ai-message-actions">
                <button
                  type="button"
                  className="ai-message-action-btn"
                  onClick={handleCopy}
                  title={copied ? "Copied response" : "Copy response"}
                  aria-label={
                    copied
                      ? "Copied response to clipboard"
                      : "Copy response to clipboard"
                  }
                >
                  <i
                    className={`bi ${copied ? "bi-check2 text-success" : "bi-copy"}`}
                    aria-hidden="true"
                  />
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export { Message };

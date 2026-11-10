"use client";

import { useEffect, useRef, useState } from "react";

export default function Reasoning({
  content = "",
  isStreaming = false,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const wasStreamingRef = useRef(isStreaming);

  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      setIsOpen(false);
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  if (!content && !isStreaming) {
    return null;
  }

  const label = isStreaming ? "Thinking..." : "Thinking Process";

  return (
    <div className="ai-reasoning">
      <button
        type="button"
        className="ai-reasoning-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="ai-reasoning-body"
        aria-label={isOpen ? "Hide thinking process" : "Show thinking process"}
      >
        <span className="ai-reasoning-title">
          <i className="bi bi-lightbulb ai-reasoning-icon" aria-hidden="true" />
          <span>{label}</span>
          {isStreaming && (
            <span
              className="ai-reasoning-pulse"
              role="status"
              aria-label="Thinking in real-time"
            />
          )}
        </span>
        <i
          className={`bi bi-chevron-down ai-reasoning-chevron ${isOpen ? "is-open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id="ai-reasoning-body"
          className="ai-reasoning-body"
          role="region"
          aria-label="Model thinking process details"
        >
          <div className="ai-reasoning-text">
            {content || (isStreaming ? "Formulating response from course principles..." : "")}
          </div>
        </div>
      )}
    </div>
  );
}

export { Reasoning };

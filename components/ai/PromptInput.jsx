"use client";

import { useEffect, useRef } from "react";

export default function PromptInput({
  value = "",
  onChange = () => {},
  onSubmit = () => {},
  onStop = null,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask Cinder about a physics lesson or formula…",
  maxLength = 1200,
  textareaRef: externalRef,
}) {
  const localRef = useRef(null);
  const inputRef = externalRef || localRef;

  // Auto-resize textarea to fit content (up to 4 rows via CSS max-height)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, inputRef]);

  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent?.isComposing) return;
      e.preventDefault();
      if (!disabled && !isStreaming && value.trim()) {
        onSubmit();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isStreaming) {
      onStop?.();
      return;
    }
    if (!disabled && value.trim()) {
      onSubmit();
    }
  };

  const count = value.length;
  const isNearLimit = count >= maxLength * 0.9;
  const isOverLimit = count >= maxLength;

  return (
    <form
      className="ai-prompt-input"
      onSubmit={handleSubmit}
      role="search"
      aria-label="Ask course assistant"
    >
      <label htmlFor="ai-prompt-textarea" className="visually-hidden">
        Ask Cinder a physics question
      </label>
      <textarea
        ref={inputRef}
        id="ai-prompt-textarea"
        className="ai-prompt-input-textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={1}
        aria-label="Question text input"
      />

      <div className="ai-prompt-input-footer">
        <span
          className={`ai-prompt-count ${isOverLimit ? "is-danger" : isNearLimit ? "is-warn" : ""}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {count}/{maxLength}
        </span>

        <div className="ai-prompt-actions">
          {isStreaming ? (
            <button
              type="button"
              className="ai-prompt-btn ai-prompt-btn-stop"
              onClick={onStop}
              aria-label="Stop generating response"
            >
              <i className="bi bi-stop-fill me-1" aria-hidden="true" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-flame ai-prompt-btn ai-prompt-btn-send"
              disabled={disabled || !value.trim()}
              aria-label="Send question"
            >
              <i className="bi bi-send-fill" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export { PromptInput };

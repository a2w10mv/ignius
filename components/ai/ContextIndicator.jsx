"use client";

export default function ContextIndicator({
  isLive = true,
  label = "Assistant.",
}) {
  return (
    <div
      className="ai-context-indicator"
      role="status"
      aria-label={label}
      title="Cinder Assistant"
    >
      <span
        className={`ai-context-dot ${isLive ? "is-live" : ""}`}
        aria-hidden="true"
      />
      <span className="ai-context-label">{label}</span>
    </div>
  );
}

export { ContextIndicator };

"use client";

export default function ContextIndicator({
  modelName = "gpt-oss-120b",
  isLive = true,
  status = "Grounded Assistant",
}) {
  const shortModel = modelName.includes("/")
    ? modelName.split("/").pop()
    : modelName;

  return (
    <div
      className="ai-context-indicator"
      role="status"
      aria-label={`Model: ${shortModel}, Status: ${status}`}
      title={`${shortModel} · ${status}`}
    >
      <span
        className={`ai-context-dot ${isLive ? "is-live" : ""}`}
        aria-hidden="true"
      />
      <span className="ai-context-model">{shortModel}</span>
      {status && <span className="ai-context-status">{status}</span>}
    </div>
  );
}

export { ContextIndicator };

"use client";

export default function Confirmation({ confirmation, onConfirm }) {
  if (!confirmation) {
    return null;
  }

  const { query = "", description = "" } = confirmation;
  const title = query
    ? `Search web for "${query}"?`
    : "Confirm external web search?";

  return (
    <div
      className="ai-confirmation"
      role="group"
      aria-label="External search confirmation"
    >
      <div className="ai-confirmation-header">
        <i
          className="bi bi-search ai-confirmation-icon"
          aria-hidden="true"
        />
        <strong className="ai-confirmation-title">{title}</strong>
      </div>

      {description && (
        <p className="ai-confirmation-desc">{description}</p>
      )}

      <div className="ai-confirmation-actions">
        <button
          type="button"
          className="ai-confirmation-btn ai-confirmation-deny"
          onClick={() => onConfirm?.(false)}
          aria-label="Deny web search"
        >
          Deny
        </button>
        <button
          type="button"
          className="ai-confirmation-btn ai-confirmation-approve"
          onClick={() => onConfirm?.(true)}
          aria-label="Approve web search"
        >
          Approve
        </button>
      </div>
    </div>
  );
}

export { Confirmation };

"use client";

export default function Suggestion({
  suggestions,
  onSelect,
  disabled = false,
}) {
  if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className="ai-suggestions"
      role="group"
      aria-label="Suggested questions"
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          type="button"
          className="ai-suggestion-pill"
          disabled={disabled}
          onClick={() => onSelect?.(suggestion)}
          aria-label={`Ask: ${suggestion}`}
        >
          <i
            className="bi bi-arrow-return-right ai-suggestion-icon"
            aria-hidden="true"
          />
          <span>{suggestion}</span>
        </button>
      ))}
    </div>
  );
}

export { Suggestion };

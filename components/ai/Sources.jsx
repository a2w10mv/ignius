"use client";

import Link from "next/link";

export default function Sources({ sources, onLinkClick }) {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <div className="ai-sources" role="group" aria-label="Course references">
      <div className="ai-sources-list">
        {sources.map((source, index) => {
          const key = source.href ? `${source.href}-${index}` : index;
          const isInternal =
            typeof source.href === "string" &&
            source.href.startsWith("/") &&
            !source.href.startsWith("//");

          if (isInternal) {
            return (
              <Link
                key={key}
                href={source.href}
                className="ai-source-chip"
                onClick={onLinkClick}
                title={source.title}
              >
                <i
                  className="bi bi-journal-text ai-source-icon"
                  aria-hidden="true"
                />
                <span className="ai-source-title">{source.title}</span>
                <i
                  className="bi bi-arrow-up-right ai-source-arrow"
                  aria-hidden="true"
                />
              </Link>
            );
          }

          return (
            <a
              key={key}
              href={source.href || "#"}
              className="ai-source-chip"
              onClick={onLinkClick}
              target="_blank"
              rel="noreferrer"
              title={source.title}
            >
              <i
                className="bi bi-link-45deg ai-source-icon"
                aria-hidden="true"
              />
              <span className="ai-source-title">{source.title}</span>
              <i
                className="bi bi-arrow-up-right ai-source-arrow"
                aria-hidden="true"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export { Sources };

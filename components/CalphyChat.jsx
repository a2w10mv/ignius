"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CalphyMascot from "@/components/CalphyMascot";
import { useUser } from "@/components/UserContext";
import { Chat } from "@/components/ai";

// idle thought-bubble lines; "…" beats in between make Cinder look like it's thinking
const idleHints = [
  "Ask Cinder",
  "Stuck on a formula?",
  "Need °C → °F fast?",
  "Want a lesson preview?",
  "Curious about heat?",
];

export default function CalphyChat() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const pathname = usePathname() || "";

  // no assistant while a quiz is being taken (/quizzes/<slug>), the list page is fine
  const onQuiz = /^\/quizzes\/[^/]+/.test(pathname);
  // the landing's hero Cinder already talks, so the launcher stays quiet there
  const onLanding = pathname === "/" || pathname === "/welcome";
  const viewer = user ? `user:${user.id}` : "guest";
  const [seenBy, setSeenBy] = useState(null);
  const seen = seenBy === viewer;
  const [hint, setHint] = useState(0);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (open || seen || onQuiz || onLanding) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let thinkTimer;
    const cycle = window.setInterval(() => {
      setThinking(true);
      thinkTimer = window.setTimeout(() => {
        setHint((i) => (i + 1) % idleHints.length);
        setThinking(false);
      }, 1100);
    }, 4800);
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(thinkTimer);
    };
  }, [open, seen, onQuiz, onLanding]);

  // other components (e.g. the landing "Ask Cinder" step) open the chat
  // by dispatching this window event
  useEffect(() => {
    const onOpen = () => openChat();
    window.addEventListener("calphy:open-chat", onOpen);
    return () => window.removeEventListener("calphy:open-chat", onOpen);
  });

  // In mobile view, close the chat when navigating so it does not block the redirected page
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setOpen(false);
    }
  }, [pathname]);

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setOpen(false);
    }
  };

  function openChat() {
    setOpen(true);
    setSeenBy(viewer);
    setHint(0);
  }

  if (onQuiz) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          className={`mascot-fab${seen ? "" : " idle"}`}
          onClick={openChat}
          aria-label="Open Cinder course assistant"
        >
          <CalphyMascot size={50} mood={!seen && thinking ? "think" : "wave"} />
          {!seen && !onLanding && (
            <span className="thought-bubble" aria-hidden="true">
              {thinking ? (
                <span className="thought-dots">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <span key={hint} className="thought-text">
                  {idleHints[hint]}
                </span>
              )}
            </span>
          )}
        </button>
      )}
      <Chat
        isOpen={open}
        onClose={() => setOpen(false)}
        onLinkClick={handleLinkClick}
      />
    </>
  );
}

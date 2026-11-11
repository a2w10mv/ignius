"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Modal } from "react-bootstrap";
import CalphyMascot from "@/components/CalphyMascot";
import { useUser } from "@/components/UserContext";
import { Chat } from "@/components/ai";

export default function CalphyChat() {
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isLoggedIn } = useUser();
  const pathname = usePathname() || "";

  // no assistant while a quiz is being taken (/quizzes/<slug>), the list page is fine
  const onQuiz = /^\/quizzes\/[^/]+/.test(pathname);
  const isSidebarVisible = open && isLoggedIn && !onQuiz;

  const openChat = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    setOpen(true);
  }, [isLoggedIn]);

  const toggleChat = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    setOpen((prev) => !prev);
  }, [isLoggedIn]);

  // Navbar Cinder logo button or "Ask Cinder" buttons dispatch these events
  useEffect(() => {
    window.addEventListener("calphy:open-chat", openChat);
    window.addEventListener("calphy:toggle-chat", toggleChat);
    return () => {
      window.removeEventListener("calphy:open-chat", openChat);
      window.removeEventListener("calphy:toggle-chat", toggleChat);
    };
  }, [openChat, toggleChat]);

  // Sync body class so desktop layout docks the sidebar cleanly like VS Code / Claude Code
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isSidebarVisible) {
      document.body.classList.add("ai-sidebar-open");
    } else {
      document.body.classList.remove("ai-sidebar-open");
    }
    return () => {
      document.body.classList.remove("ai-sidebar-open");
    };
  }, [isSidebarVisible]);

  // In mobile view, close the chat when navigating so it does not block the redirected page
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      const raf = requestAnimationFrame(() => setOpen(false));
      return () => cancelAnimationFrame(raf);
    }
  }, [pathname]);

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setOpen(false);
    }
  };

  const closeAuthModal = () => setShowAuthModal(false);

  if (onQuiz) return null;

  return (
    <>
      <Modal
        show={showAuthModal && !isLoggedIn}
        onHide={closeAuthModal}
        centered
        contentClassName="save-prompt"
        aria-labelledby="cinder-auth-prompt-title"
      >
        <Modal.Header closeButton>
          <Modal.Title
            id="cinder-auth-prompt-title"
            className="h5 fw-bold d-flex align-items-center gap-2"
          >
            <CalphyMascot size={28} mood="wave" />
            <span>Log in to chat with Cinder</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Cinder AI is available exclusively to signed-in learners. Log in or
          create a free account to ask physics questions, solve formulas step by
          step, and get personalized study help.
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-ink"
            onClick={closeAuthModal}
          >
            Maybe later
          </button>
          <Link
            href="/register"
            className="btn btn-outline-ink"
            onClick={closeAuthModal}
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="btn btn-flame"
            onClick={closeAuthModal}
          >
            Log in
          </Link>
        </Modal.Footer>
      </Modal>

      <Chat
        isOpen={isSidebarVisible}
        onClose={() => setOpen(false)}
        onLinkClick={handleLinkClick}
      />
    </>
  );
}

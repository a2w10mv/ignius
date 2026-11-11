"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Container, Dropdown, Nav, Navbar } from "react-bootstrap";
import { useUser } from "@/components/UserContext";
import CalphyMascot from "@/components/CalphyMascot";
import SiteSearch from "@/components/SiteSearch";

const LINKS = [
  { href: "/learn", label: "Home", icon: "bi-house-door" },
  { href: "/lessons", label: "Lessons", icon: "bi-journal-bookmark" },
  { href: "/simulations", label: "Simulations", icon: "bi-joystick" },
  { href: "/quizzes", label: "Quizzes", icon: "bi-patch-question" },
  { href: "/formulas", label: "∑ Formulas", icon: "bi-mortarboard" },
  { href: "/dashboard", label: "Dashboard", icon: "bi-graph-up-arrow" },
];

export default function SiteNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout, authLoading } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [theme, setTheme] = useState(null);
  const [showCinderDot, setShowCinderDot] = useState(false);
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState(null);

  const isActive = (href) => pathname.startsWith(href);
  // Nav remembers the last clicked link on its own; pin it to the URL instead
  const activeHref = LINKS.find((l) => isActive(l.href))?.href ?? null;

  const measureLink = useCallback((el) => {
    if (!el) {
      setIndicator((prev) => (prev ? { ...prev, opacity: 0 } : null));
      return;
    }
    const pad = 11;
    setIndicator({
      left: el.offsetLeft + pad,
      width: Math.max(0, el.offsetWidth - pad * 2),
      opacity: 1,
    });
  }, []);

  const syncToActive = useCallback(() => {
    const activeEl = navRef.current?.querySelector('[aria-current="page"]');
    measureLink(activeEl || null);
  }, [measureLink]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(syncToActive);
    window.addEventListener("resize", syncToActive);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", syncToActive);
    };
  }, [activeHref, syncToActive]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setTheme(document.documentElement.dataset.theme || "light"),
    );
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Show Cinder notification dot if user hasn't opened it yet
    try {
      if (!localStorage.getItem("cinder_notification_seen")) {
        setShowCinderDot(true);
      }
    } catch {}

    const dismissDot = () => {
      setShowCinderDot(false);
      try {
        localStorage.setItem("cinder_notification_seen", "true");
      } catch {}
    };

    window.addEventListener("calphy:open-chat", dismissDot);
    window.addEventListener("calphy:toggle-chat", dismissDot);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("calphy:open-chat", dismissDot);
      window.removeEventListener("calphy:toggle-chat", dismissDot);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("calphy-theme", next);
    setTheme(next);
  };

  const handleCinderClick = () => {
    setExpanded(false);
    setShowCinderDot(false);
    try {
      localStorage.setItem("cinder_notification_seen", "true");
    } catch {}
    window.dispatchEvent(new CustomEvent("calphy:toggle-chat"));
  };

  const handleLogout = async () => {
    await logout();
    setExpanded(false);
    router.push("/learn");
  };

  return (
    <Navbar
      expand="lg"
      fixed="top"
      className={`calphy-nav ${scrolled ? "scrolled" : ""}`}
      expanded={expanded}
      onToggle={(exp) => setExpanded(exp)}
    >
      <Container>
        <Navbar.Brand as={Link} href="/welcome" onClick={() => setExpanded(false)}>
          <CalphyMascot size={24} />
          <span>Ignius</span>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="main-nav"
          aria-expanded={expanded}
          aria-label={expanded ? "Close navigation" : "Open navigation"}
          className="calphy-toggler border-0 shadow-none d-lg-none"
        >
          <i
            className={`bi ${expanded ? "bi-x-lg" : "bi-list"}`}
            aria-hidden="true"
          />
        </Navbar.Toggle>

        <Navbar.Collapse id="main-nav">
          <Nav
            ref={navRef}
            className="mx-lg-auto align-items-lg-center position-relative"
            data-has-indicator={indicator ? "true" : undefined}
            onMouseLeave={syncToActive}
          >
            {LINKS.map((l) => {
              const active = l.href === activeHref;
              return (
                <Nav.Link
                  key={l.href}
                  as={Link}
                  href={l.href}
                  active={active}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={(e) => measureLink(e.currentTarget)}
                  onFocus={(e) => measureLink(e.currentTarget)}
                  onClick={() => setExpanded(false)}
                >
                  <i className={`bi ${l.icon} nav-link-icon d-lg-none`} aria-hidden="true" />
                  <span>{l.label}</span>
                </Nav.Link>
              );
            })}
            {indicator && (
              <span
                className="nav-underline-indicator d-none d-lg-block"
                aria-hidden="true"
                style={{
                  transform: `translateX(${indicator.left}px)`,
                  width: `${indicator.width}px`,
                  opacity: indicator.opacity,
                }}
              />
            )}
          </Nav>

          <div className="nav-actions ms-lg-3">
            <SiteSearch onNavigate={() => setExpanded(false)} />
            <div className="nav-bottom-row">
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <i
                  className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`}
                  aria-hidden="true"
                />
              </button>
              {authLoading ? (
                <span className="nav-loading-pill">
                  <span className="spinner-border spinner-border-sm" />
                </span>
              ) : isLoggedIn ? (
                <Dropdown align={{ lg: "end" }}>
                  <Dropdown.Toggle
                    as="button"
                    className="nav-user-chip"
                    style={{ cursor: "pointer" }}
                  >
                    <span className="nav-avatar rounded-circle d-inline-flex align-items-center justify-content-center">
                      {user.username[0].toUpperCase()}
                    </span>
                    <span className="nav-username text-truncate">{user.username}</span>
                    <i className="bi bi-chevron-down nav-user-caret" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="nav-user-menu shadow border-1">
                    <Dropdown.Item
                      as={Link}
                      href="/dashboard"
                      onClick={() => setExpanded(false)}
                    >
                      <i className="bi bi-graph-up-arrow me-2" /> My progress
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <i className="bi bi-box-arrow-right me-2" /> Log out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-flame btn-sm nav-login-btn"
                  onClick={() => setExpanded(false)}
                >
                  <i className="bi bi-person me-1" /> Log in
                </Link>
              )}
              {!/^\/quizzes\/[^/]+/.test(pathname || "") && (
                <button
                  type="button"
                  className="cinder-nav-trigger"
                  onClick={handleCinderClick}
                  title="Open Cinder AI Assistant"
                  aria-label="Toggle Cinder AI Assistant"
                >
                  <CalphyMascot size={20} />
                  {showCinderDot && <span className="cinder-status-dot" />}
                </button>
              )}
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

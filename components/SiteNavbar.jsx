"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setTheme(document.documentElement.dataset.theme || "light"),
    );
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("calphy-theme", next);
    setTheme(next);
  };

  const isActive = (href) => pathname.startsWith(href);
  // Nav remembers the last clicked link on its own; pin it to the URL instead
  const activeHref = LINKS.find((l) => isActive(l.href))?.href ?? null;

  const handleLogout = async () => {
    await logout();
    setExpanded(false);
    router.push("/learn");
  };

  return (
    <Navbar
      expand="xl"
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
          className="calphy-toggler border-0 shadow-none d-xl-none"
        >
          <i
            className={`bi ${expanded ? "bi-x" : "bi-list"}`}
            aria-hidden="true"
          />
        </Navbar.Toggle>

        <Navbar.Collapse id="main-nav">
          <Nav className="mx-auto align-items-xl-center" activeKey={activeHref}>
            {LINKS.map((l) => (
              <Nav.Link
                key={l.href}
                as={Link}
                href={l.href}
                eventKey={l.href}
                aria-current={l.href === activeHref ? "page" : undefined}
                onClick={() => setExpanded(false)}
              >
                <i className={`bi ${l.icon} me-2 d-xl-none`} />
                {l.label}
              </Nav.Link>
            ))}
          </Nav>

          <div className="nav-actions d-flex align-items-center gap-2 ms-xl-3 mt-3 mt-xl-0">
            <SiteSearch onNavigate={() => setExpanded(false)} />
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
                <span className="spinner-border spinner-border-sm me-1" />
              </span>
            ) : isLoggedIn ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  as="button"
                  className="nav-user-chip border-0"
                  style={{ cursor: "pointer" }}
                >
                  <span className="nav-avatar rounded-circle d-inline-flex align-items-center justify-content-center">
                    {user.username[0].toUpperCase()}
                  </span>
                  <span className="nav-username">{user.username}</span>
                  <i className="bi bi-chevron-down nav-user-caret" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow border-1">
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
                onClick={() => {
                  setExpanded(false);
                  window.dispatchEvent(new CustomEvent("calphy:toggle-chat"));
                }}
                title="Open Cinder AI Assistant"
                aria-label="Toggle Cinder AI Assistant"
              >
                <CalphyMascot size={20} />
                <span className="cinder-status-dot" />
              </button>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

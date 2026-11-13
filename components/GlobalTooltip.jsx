"use client";

import { useEffect, useRef, useState } from "react";

export default function GlobalTooltip() {
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: "",
    x: 0,
    y: 0,
    position: "top",
  });
  const timeoutRef = useRef(null);
  const currentTargetRef = useRef(null);
  const tooltipNodeRef = useRef(null);

  useEffect(() => {
    // Only enable on devices with hover capability to prevent sticky tooltips on mobile
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) {
      return;
    }

    const getTooltipText = (target) => {
      if (!target || target === document.body || target === document.documentElement) {
        return null;
      }

      // Check closest interactive target or element with explicit tooltip/title/aria-label
      const el = target.closest(
        "[data-tooltip], [title], [data-cached-title], button, a, input, select, textarea, [role='button']"
      );
      if (!el) return null;

      // 1. Explicit data-tooltip
      const dataTooltip = el.getAttribute("data-tooltip");
      if (dataTooltip && dataTooltip.trim()) return { el, text: dataTooltip.trim() };

      // 2. Title attribute (suppress native browser tooltip by moving to data-cached-title)
      const title = el.getAttribute("title");
      if (title && title.trim()) {
        const text = title.trim();
        el.setAttribute("data-cached-title", text);
        el.removeAttribute("title");
        return { el, text };
      }

      const cachedTitle = el.getAttribute("data-cached-title");
      if (cachedTitle && cachedTitle.trim()) {
        return { el, text: cachedTitle.trim() };
      }

      // 3. Aria-label on icon-only or short-labeled controls
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.trim()) {
        const innerText = el.innerText?.trim() || "";
        // Only show if the visible text doesn't already convey the label
        if (!innerText || innerText.length < 3 || innerText.toLowerCase() !== ariaLabel.trim().toLowerCase()) {
          return { el, text: ariaLabel.trim() };
        }
      }

      return null;
    };

    const hide = () => {
      clearTimeout(timeoutRef.current);
      if (currentTargetRef.current) {
        const cached = currentTargetRef.current.getAttribute("data-cached-title");
        if (cached && !currentTargetRef.current.hasAttribute("title")) {
          currentTargetRef.current.setAttribute("title", cached);
        }
        currentTargetRef.current = null;
      }
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const show = (el, text) => {
      if (!el || !text) return;
      clearTimeout(timeoutRef.current);
      currentTargetRef.current = el;

      timeoutRef.current = setTimeout(() => {
        if (!document.contains(el)) return;
        const rect = el.getBoundingClientRect();
        const spaceTop = rect.top;
        const placeBelow = spaceTop < 42;

        const targetX = rect.left + rect.width / 2;
        const targetY = placeBelow ? rect.bottom + 8 : rect.top - 8;

        setTooltip({
          visible: true,
          text,
          x: targetX,
          y: targetY,
          position: placeBelow ? "bottom" : "top",
        });
      }, 120);
    };

    const handlePointerOver = (e) => {
      const match = getTooltipText(e.target);
      if (match) {
        show(match.el, match.text);
      } else {
        hide();
      }
    };

    const handlePointerOut = (e) => {
      if (!e.relatedTarget || !currentTargetRef.current?.contains(e.relatedTarget)) {
        hide();
      }
    };

    const handleFocusIn = (e) => {
      const match = getTooltipText(e.target);
      if (match) {
        show(match.el, match.text);
      }
    };

    window.addEventListener("pointerover", handlePointerOver, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("focusin", handleFocusIn, { passive: true });
    window.addEventListener("focusout", hide, { passive: true });
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("pointerdown", hide, { passive: true });

    return () => {
      clearTimeout(timeoutRef.current);
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", hide);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("pointerdown", hide);
    };
  }, []);

  // Clamp horizontal position so tooltip stays within the viewport padding
  useEffect(() => {
    if (tooltip.visible && tooltipNodeRef.current) {
      const node = tooltipNodeRef.current;
      const rect = node.getBoundingClientRect();
      const pad = 12;
      let shiftX = 0;
      if (rect.left < pad) {
        shiftX = pad - rect.left;
      } else if (rect.right > window.innerWidth - pad) {
        shiftX = window.innerWidth - pad - rect.right;
      }
      if (shiftX !== 0) {
        node.style.left = `${tooltip.x + shiftX}px`;
      }
    }
  }, [tooltip.visible, tooltip.x]);

  if (!tooltip.visible || !tooltip.text) return null;

  return (
    <div
      ref={tooltipNodeRef}
      className={`site-global-tooltip site-global-tooltip--${tooltip.position}`}
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
      }}
      role="tooltip"
      aria-hidden="true"
    >
      {tooltip.text}
    </div>
  );
}

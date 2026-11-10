# CalphyChat Remodel with Shadcn AI Elements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remodel CalphyChat with modular shadcn AI Elements, real-time token streaming with live `<think>` reasoning visualization for `openai/gpt-oss-120b`, friendly system instructions, and CSS consolidation.

**Architecture:** A Server-Sent Events streaming backend (`/api/assistant`) proxies `openai/gpt-oss-120b` on Groq with raw reasoning tags. The frontend decomposes into reusable shadcn AI Elements (`Chat`, `Message`, `PromptInput`, `Reasoning`, `Sources`, `Confirmation`, `Suggestion`, `ContextIndicator`) styled with theme CSS tokens. Loose CSS in `components/ScrollFloat.css` is consolidated into `app/globals.css`.

**Tech Stack:** Next.js 16 (App Router), React 19, Groq API (`openai/gpt-oss-120b`), ReactMarkdown, RemarkGfm, RemarkMath, RehypeKatex, Bootstrap 5 + CSS variables.

**Spec:** `docs/superpowers/specs/2026-11-10-calphy-chat-shadcn-ai-design.md`

## Global Constraints

- Must run with Next.js 16 and React 19 without hydration or build errors.
- Must support both light mode and dark mode via `[data-theme="dark"]` using CSS variables (`--surface`, `--ember`, `--line`, `--ink`, `--bg`, etc.).
- Math formulas must continue rendering via KaTeX ($$...$$ and $...$).
- Mobile screens (<= 768px) must maintain clean touch responsiveness and auto-close on navigation.
- No Tailwind CSS installation to avoid CSS reset conflicts with Bootstrap 5.

## Review Focus

1. **Unclosed `<think>` tags during streaming**: When `gpt-oss-120b` begins streaming thought tokens, the opening `<think>` is received without a closing `</think>` until reasoning finishes. The parser must display the `Reasoning` component in active streaming state without dumping raw tags into the answer.
2. **Missing `GROQ_API_KEY` or API failure**: The streaming route must handle network timeouts or missing keys gracefully by falling back to grounded course material rather than terminating abruptly.
3. **KaTeX delimiter formatting**: Math delimiters (`\[...\]`, `\(...\)`) from the model must be normalized to `$$...$$` and `$...$` so `rehype-katex` renders equations correctly.
4. **History sanitization**: Multi-turn history sent back to Groq must strip previous `<think>...</think>` blocks to avoid context overflow.
5. **Mobile viewport behavior**: The chat panel must fit on small mobile screens (`width: min(420px, calc(100vw - 1.5rem))`, `height: min(620px, calc(100dvh - 2rem))`) without overflowing.

---

### Task 1: CSS Cleanup & ScrollFloat Consolidation

**Files:**
- Modify: `app/globals.css`
- Modify: `components/ScrollFloat.jsx`
- Delete: `components/ScrollFloat.css`

**Interfaces:**
- Consumes: Existing styles in `components/ScrollFloat.css`.
- Produces: Global class definitions for `.scroll-float`, `.scroll-float--open`, `.scroll-float-text`, `.scroll-float-word`, `.scroll-float-char` inside `app/globals.css`.

- [ ] **Step 1: Copy rules from `components/ScrollFloat.css` to `app/globals.css`**
  Add the 5 `.scroll-float*` rules under an `/* ScrollFloat animations */` section in `app/globals.css`.
- [ ] **Step 2: Remove `import './ScrollFloat.css';` from `components/ScrollFloat.jsx`**
  Delete line 7 of `components/ScrollFloat.jsx`.
- [ ] **Step 3: Delete `components/ScrollFloat.css`**
  Remove the standalone file.
- [ ] **Step 4: Verify build succeeds**
  Run: `npm run build`
  Expected: Production build compiles without CSS resolution errors.

---

### Task 2: Backend Streaming API & Friendly Rules Rework

**Files:**
- Modify: `app/api/assistant/route.js`

**Interfaces:**
- Consumes: `findCourseMatches`, `isCourseRelated`, `requestsWebSearch`, `getModelContext`, `selectSourcesForAnswer` from `@/lib/assistant`.
- Produces: A `POST` endpoint returning `Content-Type: text/event-stream; charset=utf-8` streaming NDJSON events (`chunk`, `done`, `error`).

- [ ] **Step 1: Write helper for SSE formatting and reasoning stripping**
  In `app/api/assistant/route.js`:
  - `stripReasoning(text)`: removes `<think>[\s\S]*?<\/think>` from previous turns.
  - `formatSSE(data)`: returns `data: ${JSON.stringify(data)}\n\n`.
- [ ] **Step 2: Rework Cinder system prompt**
  Update `SYSTEM_PROMPT` to embody Cinder as a warm, friendly, encouraging physics companion who explains heat & temperature concepts clearly, walks through formulas step-by-step with KaTeX, and reasons in `<think>` blocks.
- [ ] **Step 3: Implement streaming with Groq API**
  Update Groq `fetch` request:
  - Add `stream: true`.
  - Set `max_completion_tokens: 2048`.
  - Set `model: process.env.GROQ_MODEL || "openai/gpt-oss-120b"`.
  - Pipe readable stream from Groq chunk-by-chunk to the client.
  - On stream end, compute citations using `selectSourcesForAnswer` and emit `{ type: "done", sources, suggestions }`.
  - For non-Groq fallback (missing key or rate limit), emit fallback answer as a single stream event `{ type: "chunk", text }` followed by `{ type: "done", ... }`.
- [ ] **Step 4: Verify streaming response via test script**
  Test calling `/api/assistant` using a node script or curl to ensure `text/event-stream` chunks emit properly.

---

### Task 3: Core Shadcn AI Primitives (`Reasoning`, `Sources`, `Confirmation`, `Suggestion`, `ContextIndicator`)

**Files:**
- Create: `components/ai/Reasoning.jsx`
- Create: `components/ai/Sources.jsx`
- Create: `components/ai/Confirmation.jsx`
- Create: `components/ai/Suggestion.jsx`
- Create: `components/ai/ContextIndicator.jsx`

**Interfaces:**
- `Reasoning`: `({ content: string, isStreaming: boolean }) => JSX.Element`
- `Sources`: `({ sources: Array<{ href: string, title: string }> }) => JSX.Element`
- `Confirmation`: `({ confirmation: { query: string, description: string }, onConfirm: (approved: boolean) => void }) => JSX.Element`
- `Suggestion`: `({ suggestions: string[], onSelect: (prompt: string) => void, disabled?: boolean }) => JSX.Element`
- `ContextIndicator`: `({ modelName?: string, status?: string }) => JSX.Element`

- [ ] **Step 1: Implement `components/ai/Reasoning.jsx`**
  - Collapsible drawer with light bulb/brain icon, "Thinking Process", chevron toggle.
  - When `isStreaming` is true, shows an animated pulsing dot and "Thinking...".
  - Markdown-rendered inner thought text.
- [ ] **Step 2: Implement `components/ai/Sources.jsx`**
  - Horizontal wrapping list of citation chips with book icon, lesson title, and link.
- [ ] **Step 3: Implement `components/ai/Confirmation.jsx`**
  - Shadcn-styled confirmation card with alert icon, query preview, explanation, and "Deny" / "Approve" buttons.
- [ ] **Step 4: Implement `components/ai/Suggestion.jsx`**
  - Pill buttons with flame hover highlight, invoking `onSelect(prompt)`.
- [ ] **Step 5: Implement `components/ai/ContextIndicator.jsx`**
  - Compact badge displaying active model (`gpt-oss-120b`) and green online indicator dot.

---

### Task 4: Interactive Input & Message Primitives (`PromptInput`, `Message`)

**Files:**
- Create: `components/ai/PromptInput.jsx`
- Create: `components/ai/Message.jsx`

**Interfaces:**
- `PromptInput`: `({ value: string, onChange: (val: string) => void, onSubmit: () => void, onStop?: () => void, isStreaming: boolean, maxLength?: number }) => JSX.Element`
- `Message`: `({ message: { role: string, content: string, reasoning?: string, isStreaming?: boolean, sources?: Array, links?: Array, confirmation?: Object }, onConfirmationResponse?: (approved: boolean) => void }) => JSX.Element`

- [ ] **Step 1: Implement `components/ai/PromptInput.jsx`**
  - Auto-resizing textarea (1 to 4 rows).
  - Handles `Enter` to submit (unless `Shift+Enter`).
  - Action row with character count (`${value.length}/1200`) and Submit button (or Stop square icon while streaming).
- [ ] **Step 2: Implement `components/ai/Message.jsx`**
  - Splits message content into reasoning (`<think>`) and response text.
  - Renders avatar (User icon vs Cinder mascot).
  - Integrates `Reasoning` element when thought content exists.
  - Formats response text with `ReactMarkdown`, `remarkGfm`, `remarkMath`, and `rehypeKatex`.
  - Includes a "Copy" button that copies plain response to clipboard with checkmark feedback.
  - Integrates `Sources` and `Confirmation` when present on the message object.

---

### Task 5: Container Assembly & Integration (`components/ai/Chat.jsx`, `components/CalphyChat.jsx`)

**Files:**
- Create: `components/ai/Chat.jsx`
- Modify: `components/CalphyChat.jsx`

**Interfaces:**
- Consumes: All `components/ai/*` primitives.
- Produces: The main floating chat interface mounted in `app/layout.jsx`.

- [ ] **Step 1: Implement `components/ai/Chat.jsx`**
  - Houses the chat window structure: Header (mascot, title, `ContextIndicator`, close button), Message list with auto-scroll lock, Suggestions, and `PromptInput`.
  - Manages stream consumption via `ReadableStreamDefaultReader` on `fetch('/api/assistant')`.
  - Supports aborting an in-flight stream via `AbortController`.
- [ ] **Step 2: Refactor `components/CalphyChat.jsx`**
  - Acts as the root controller: manages open/close state, mobile route auto-close, idle mascot fab with thought bubble animations, and renders `<Chat />`.
  - Clean up any unused legacy methods or duplicate state.

---

### Task 6: Styling & Polish in `app/globals.css`

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Defines clean, high-contrast CSS classes: `.ai-chat-*`, `.ai-message-*`, `.ai-reasoning-*`, `.ai-sources-*`, `.ai-input-*`, `.ai-pill-*`, matching shadcn AI Elements aesthetics.
- Supports light mode and `[data-theme="dark"]`.

- [ ] **Step 1: Add shadcn AI Elements CSS classes in `app/globals.css`**
  - Style chat header, messages container, user/assistant message bubbles, reasoning drawer, sources pills, prompt input textarea, and suggestion buttons.
- [ ] **Step 2: Remove obsolete legacy `.mascot-panel*` and `.assistant-*` CSS**
  - Clean up dead CSS that was replaced by the new modular `.ai-*` classes.
- [ ] **Step 3: Ensure responsive styling for mobile devices**
  - Make sure full chat fits comfortably on mobile screens (padding, touch target sizes >= 44px).

---

### Task 7: End-to-End Verification & Build Test

**Files:**
- Test: Build, client runtime, and streaming behavior.

- [ ] **Step 1: Run production build check**
  Run: `npm run build`
  Expected: Compiles with 0 errors and generates all pages.
- [ ] **Step 2: Test streaming and reasoning behavior**
  Verify that asking a physics question streams the response, expands `<think>` reasoning, renders math formulas with KaTeX, and displays sources.
- [ ] **Step 3: Test suggestions, copy action, and search confirmation**
  Verify all interactive controls work without errors.
- [ ] **Step 4: Verify LearnHome and simulations scroll animations**
  Verify that `ScrollFloat` animations still work after `ScrollFloat.css` consolidation.

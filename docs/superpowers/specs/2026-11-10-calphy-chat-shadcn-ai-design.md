# CalphyChat Remodel with Shadcn AI Elements, Streaming & Reworked Rules

**Date:** 2026-11-10  
**Status:** Approved by User  
**Topic:** Remodeling CalphyChat with Shadcn AI Elements, Real-Time Streaming, Friendly Prompt Rules, and CSS Cleanup

---

## 1. Intent and Why

The user wants to modernize the **CalphyChat** (Cinder) assistant on Ignius using official **shadcn AI Elements** design patterns and component architecture.
The assistant uses the **`openai/gpt-oss-120b`** reasoning model on Groq. The existing chat UI is monolithic ([components/CalphyChat.jsx](file:///D:/coders/calph/ignius/components/CalphyChat.jsx)), lacks real-time streaming, lacks reasoning inspection for thinking models, has basic text inputs without multiline auto-resize or message action tools, and the assistant's system instructions sound rigid and robotic. Additionally, an isolated CSS file ([components/ScrollFloat.css](file:///D:/coders/calph/ignius/components/ScrollFloat.css)) sits in `components/` despite the app using Bootstrap 5 and [app/globals.css](file:///D:/coders/calph/ignius/app/globals.css).

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Modular Shadcn AI Elements**: Create discrete, reusable AI components in `components/ai/`:
  1. `Chat.jsx`: Core thread container, header with mascot, live streaming indicator, collapse/close actions, and auto-scroll message scroller.
  2. `Message.jsx`: Chat message turns with avatar, formatted Markdown, KaTeX math support, copy button, and timestamp.
  3. `Reasoning.jsx`: Collapsible real-time chain-of-thought drawer that extracts and renders `<think>` tokens from `gpt-oss-120b` live as they stream.
  4. `Sources.jsx`: Grounded lesson and formula citation badges linking directly to course pages.
  5. `Confirmation.jsx`: Tool approval card for external web search confirmations.
  6. `Suggestion.jsx`: Quick starter and contextual follow-up prompt pills.
  7. `PromptInput.jsx`: Auto-resizing textarea with keyboard shortcuts (Enter to send, Shift+Enter for newline), character count, and stop/busy state.
  8. `ContextIndicator.jsx`: Model badge displaying `gpt-oss-120b` and course-grounded status.
- **Real-Time Streaming Pipeline**:
  - Convert [app/api/assistant/route.js](file:///D:/coders/calph/ignius/app/api/assistant/route.js) to stream text and metadata using Server-Sent Events / ReadableStream.
  - Stream Groq's `chat.completions.create({ stream: true })` tokens directly to the client.
  - Parse `<think>` tags in-flight so users can watch Cinder's thinking process unfold live before the final answer streams.
- **Rework Assistant System Instructions**: Rewrite Cinder's prompt in [app/api/assistant/route.js](file:///D:/coders/calph/ignius/app/api/assistant/route.js) to be warm, friendly, encouraging, and pedagogically clear, while maintaining course grounding and reasoning formatting.
- **Cleanup & CSS Consolidation**:
  - Move animations/styles from [components/ScrollFloat.css](file:///D:/coders/calph/ignius/components/ScrollFloat.css) into [app/globals.css](file:///D:/coders/calph/ignius/app/globals.css) and remove the isolated CSS file.
  - Update [components/ScrollFloat.jsx](file:///D:/coders/calph/ignius/components/ScrollFloat.jsx) to remove the import.
  - Remove dead or superseded chat CSS in `app/globals.css`.

### Non-Goals
- Installing Tailwind CSS across the entire repository (risks regressions against Bootstrap 5 across lessons, simulations, and auth forms).
- Changing the underlying database, session auth, or quiz logic.

### Anti-Goals
- Breaking LaTeX/KaTeX equation rendering in assistant responses.
- Breaking responsive behaviors on mobile devices (e.g. screen <= 768px auto-closing).
- Over-complicating streaming with external cloud dependencies.

---

## 3. Approaches Considered & Trade-offs

### Approach 1: Native Shadcn AI Element Primitives with Standard Web Streams (Selected)
- Build component primitives matching shadcn AI Elements specifications using clean CSS classes backed by existing CSS variables (`--surface`, `--ember`, `--line`, `--ink`, `--bg`).
- Server streams Server-Sent Events (SSE) / `text/event-stream` chunks from Groq, ending with an event containing metadata (citations, suggestions, search confirmation).
- Client reads stream using native `ReadableStream` (`fetch` with reader), updating state reactively without external heavy dependencies.
- Zero framework collisions with Bootstrap 5.

### Approach 2: Tailwind CSS + Shadcn CLI
- Add `@tailwindcss/postcss` and pull shadcn components via CLI.
- **Rejected**: Tailwind preflight resets clash with Bootstrap reboot/table/form styles across the app.

---

## 4. Architectural Details

### 4.1 Component Breakdown in `components/ai/`
- **`components/ai/Chat.jsx`**:
  - Encapsulates panel lifecycle, floating action button (FAB) with thought bubbles, header with mascot, model indicator, and message scroller.
  - Manages stream abort controller (for "Stop generating" action).
- **`components/ai/Message.jsx`**:
  - Splits streaming message content into `<think>...</think>` (passed to `Reasoning`) and the main response.
  - Handles incomplete `<think>` tags during streaming (displaying active thinking state).
  - Renders Markdown via `react-markdown` + `remark-math` + `rehype-katex`.
  - Includes a quick "Copy response" action button with visual feedback.
- **`components/ai/Reasoning.jsx`**:
  - Collapsible accordion with an icon, "Thinking Process", and duration/streaming pulse indicator.
  - Auto-collapses on answer completion or remains toggleable by user.
- **`components/ai/Sources.jsx`**:
  - Renders structured citation pills for lessons, formulas, and constants referenced in the answer.
- **`components/ai/Confirmation.jsx`**:
  - Clear confirmation card for external actions (e.g. Google Search) with Deny / Approve buttons.
- **`components/ai/Suggestion.jsx`**:
  - Clickable chips for sample queries and context-relevant topic shortcuts.
- **`components/ai/PromptInput.jsx`**:
  - Multiline auto-expanding textarea, character counter (up to 1200), send/stop button, and keyboard submission (`Enter` sends, `Shift+Enter` new line).
- **`components/ai/ContextIndicator.jsx`**:
  - Displays "openai/gpt-oss-120b" badge and course grounding indicator in the chat header.

### 4.2 API & System Prompt Rework ([app/api/assistant/route.js](file:///D:/coders/calph/ignius/app/api/assistant/route.js))
- **Model**: `process.env.GROQ_MODEL || "openai/gpt-oss-120b"`.
- **Reasoning Configuration**: `max_completion_tokens: 2048`, `reasoning_format: "raw"`, `stream: true`.
- **Sanitized History**: Strips `<think>...</think>` tags from prior assistant turns before sending to Groq to conserve context window.
- **Persona & Rules**:
  - Friendly, cheerful, and encouraging tone ("Hey there! 🔥", "Let's work through this step by step!").
  - Clear explanations of temperature, heat, thermal expansion, gas laws, and calorimetry with intuitive physical examples.
  - Step-by-step math breakdowns with KaTeX LaTeX notation ($$Q = mc\Delta T$$).
  - Embeds reasoning inside `<think>` tags so the client parses and renders it in the `Reasoning` component.
  - Grounds facts in the course syllabus; gently redirects off-topic questions.

### 4.3 Streaming Protocol
- The endpoint returns `Content-Type: text/event-stream; charset=utf-8`.
- Streaming events:
  - `data: {"type": "chunk", "text": "..."}` for content and `<think>` tokens.
  - `data: {"type": "done", "sources": [...], "suggestions": [...], "confirmation": ...}` for final metadata.
  - `data: {"type": "error", "error": "..."}` if an issue occurs.

### 4.4 ScrollFloat.css Cleanup
- Move `.scroll-float`, `.scroll-float--open`, `.scroll-float-text`, `.scroll-float-word`, and `.scroll-float-char` rules into [app/globals.css](file:///D:/coders/calph/ignius/app/globals.css).
- Remove `import './ScrollFloat.css';` from [components/ScrollFloat.jsx](file:///D:/coders/calph/ignius/components/ScrollFloat.jsx).
- Delete `components/ScrollFloat.css`.

---

## 5. Verification Plan
1. **Compilation**: Run `npm run build` to confirm zero Next.js or React compiler errors.
2. **Streaming & Reasoning Test**:
   - Send question: "How much heat is needed to warm 2 kg of water from 20°C to 50°C?"
   - Verify `<think>` reasoning block streams and collapses/expands properly.
   - Verify final math response renders KaTeX formulas ($$Q = mc\Delta T$$).
   - Verify sources are listed as citations.
3. **Component Elements Test**:
   - Test `PromptInput` (auto-resize, Enter key, character counter).
   - Test `Suggestion` pills (click triggers query).
   - Test `Confirmation` tool (asking for off-course topic triggers web search prompt with approve/deny).
   - Test `Copy` button on assistant message.
4. **Responsive Check**: Test mobile viewport behavior (auto-closing on navigation, touch scrolling).
5. **ScrollFloat Check**: Verify animations on `/learn` and `/simulations` continue working smoothly without `ScrollFloat.css`.

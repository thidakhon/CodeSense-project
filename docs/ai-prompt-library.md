# AI Prompt Library

A well-organized catalog of all prompts and prompt-engineering patterns used in this project. Each entry includes purpose, key techniques, variables, and examples.

Project paths referenced below:
- Backend: `backend/server.js`
- Frontend: `frontend/src/`

---

## 1) Current Prompts in Code

- System Prompt: `backend/server.js` → `SYSTEM_PROMPT`
  - Purpose: Sets the assistant’s role and response style for code assistance.
  - Content:
    - "You are Code Whisperer, an expert senior software engineer. Explain clearly, prefer practical snippets, provide minimal viable solutions first, improvements second, use Markdown."
  - Technique: Role-based system prompt + style constraints.
  - Used by: `/api/chat` and `/api/chat/stream` endpoints as the first message in `messages`.

- Policy Prompt (code-only gate): `backend/server.js` → `isCodeRelated()` enforcement
  - Purpose: Politely restrict the assistant to programming topics.
  - Content shape: When not code-related, returns guidance text that explains what the bot can do and examples it can help with.
  - Technique: Input classification + policy reminder message.

- Greeting Fast-Path: `backend/server.js` → `isGreeting()`
  - Purpose: Short-circuit greetings with a quick, static reply for snappy UX.
  - Technique: Heuristic check; no LLM call.

- Mock/Fallback Messages: `backend/server.js`
  - Purpose: Provide helpful responses when `OPENAI_API_KEY` is missing or upstream errors occur.
  - Technique: Non-LLM canned outputs to keep local dev unblocked.

---

## 2) Recommended Structure for Prompts

Use the following template when adding or updating prompts. Keep all entries here in sync with code and UI copy.

- Name: A short, unique name
- Purpose: Why this prompt exists and when to use it
- Technique(s): Role, style, constraints, few-shot, chain-of-thought alternatives, tool-use hints
- Variables: {placeholders} and their data types
- Prompt Text: The exact message sent to the model (or pseudo-template)
- Example Input/Output: One concise example
- Owner: Person/team responsible
- Version: vX.Y, and a changelog note

---

## 3) Core Reusable Prompt Templates

Below are ready-to-use prompt templates suited to this app’s domain. You can pass them as the first system message or as user messages depending on your flow.

- Name: Code Explainer (System)
  - Purpose: Explain code and provide concise steps with examples
  - Technique(s): Role + style + constraints
  - Variables: none
  - Prompt Text:
    "You are a senior software engineer who explains code with concise, numbered steps and minimal examples. Prefer copy-pastable snippets. Use Markdown."

- Name: Bug Debugger
  - Purpose: Diagnose errors from logs and propose fixes
  - Technique(s): Error-focused structured reasoning
  - Variables: {stack_trace}, {code_snippet}, {context}
  - Prompt Text:
    "Given the stack trace and code, identify the root cause. Respond with: 1) Cause, 2) Minimal fix, 3) Safer refactor, 4) Test to prevent regression."

- Name: Refactor for Clarity
  - Purpose: Improve readability without changing behavior
  - Technique(s): Constraints on scope; style guide adherence
  - Variables: {code_snippet}, {style_prefs}
  - Prompt Text:
    "Refactor the code for clarity and maintainability without altering behavior. Apply {style_prefs}. Explain the diff and reasoning briefly."

- Name: Test Generator
  - Purpose: Create unit tests
  - Technique(s): MVS first, then expansions
  - Variables: {code_snippet}, {framework}, {edge_cases?}
  - Prompt Text:
    "Generate minimal passing tests for the code using {framework}. Cover typical path + 2 edge cases. Include setup/teardown if needed."

- Name: API Contract Clarifier
  - Purpose: Draft or validate an endpoint contract
  - Technique(s): Schema-first thinking
  - Variables: {endpoint}, {request_schema}, {response_schema}
  - Prompt Text:
    "Validate the API contract for {endpoint}. Output: request schema, response schema, status codes, examples, and backward compatibility notes."

- Name: SQL Helper
  - Purpose: Write safe SQL
  - Technique(s): Parameterized queries; perf notes
  - Variables: {natural_language_request}, {tables}
  - Prompt Text:
    "Write a parameterized SQL query to satisfy: {natural_language_request}. Include an explanation and potential indexes."

- Name: Docstring Writer
  - Purpose: Document functions/classes
  - Technique(s): Infer intent and usage examples
  - Variables: {code_snippet}, {style}
  - Prompt Text:
    "Write a {style} docstring that covers summary, params, returns, exceptions, and a short usage example."

- Name: Commit Message Generator
  - Purpose: Generate conventional commits
  - Technique(s): Conventional commits format
  - Variables: {diff_summary}
  - Prompt Text:
    "Create a conventional commit message (type(scope): subject) from this diff: {diff_summary}. Include a concise body and BREAKING CHANGE if applicable."

- Name: PR Review Assistant
  - Purpose: Review changes with actionable feedback
  - Technique(s): Checklist + risk callouts
  - Variables: {diff_summary}, {project_context}
  - Prompt Text:
    "Review the following changes. Output: Summary, Risks, Missing Tests, Naming/Structure suggestions, and a final LGTM/Request-changes verdict."

---

## 4) Prompt Engineering Guidelines

- Constraints first:
  - State role, scope, and output format explicitly.
  - Ask for minimal viable solution first; follow with iterative improvements.

- Use variables clearly:
  - Surround placeholders with `{like_this}` and list them in a Variables section.

- Prefer structure:
  - Ask for numbered steps, bullet lists, and fenced code blocks.

- Safety and correctness:
  - Add reminders about idempotence, not fabricating APIs, and including imports.
  - For SQL or security-sensitive tasks, require parameterization and note risks.

- Streaming:
  - Keep early tokens useful: start with the final answer outline, then details.

- Few-shot examples:
  - Include 1–2 short examples to teach format; keep domain-specific.

---

## 5) How to Use in This Codebase

- Backend chat endpoints: `backend/server.js`
  - `SYSTEM_PROMPT` is prepended to every conversation.
  - To swap prompts dynamically, consider loading from a config file (e.g., `backend/prompts.json`) or environment-based variants.

- Frontend UI copy: `frontend/src/App.jsx`
  - The initial assistant bubble sets expectations. Keep it aligned with the System Prompt.

- Suggested refactor (optional):
  - Extract prompts to `backend/prompts.js` or `backend/prompts/*.md` and import into `server.js` so non-engineers can contribute.

Example `prompts.js` shape:
```js
export const SYSTEM_PROMPT = `...`;
export const PROMPTS = {
  bugDebugger: ({ stack, code, ctx }) => `Given this stack: ${stack} ...`,
  // ...
};
```

---

## 6) Versioning and Ownership

- Owner: Team Core (Backend + Frontend)
- Version: v1.0
- Changelog:
  - v1.0: Initial library. Documented current prompts and provided reusable templates.

---

## 7) Quick Checklist Before Shipping a New/Edited Prompt

- Purpose and scope are clear
- Output format is specific and testable
- Variables are named and described
- Example input/output is provided
- Safety and correctness notes included
- Aligned with UI tone and product constraints

---

If you want, I can also extract `SYSTEM_PROMPT` into a shared `backend/prompts.js` and wire it up so editing this doc can flow into code via small PRs.

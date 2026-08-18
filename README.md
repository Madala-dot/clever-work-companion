# AI Workplace Productivity Assistant

An AI-powered productivity web app that automates everyday workplace tasks — writing
emails, summarising meetings, planning the day, researching topics and answering
questions — in one clean, professional SaaS-style workspace.

Live app: https://clever-work-companion.lovable.app

## Problem it solves

Knowledge workers lose hours every week to repetitive writing, note tidying and
prioritisation. This assistant turns those tasks into a few clicks, while keeping a
human in the loop: every AI output is editable and copyable before it is used.

## Features

| Tool | What it does |
| --- | --- |
| **Dashboard** | Overview of all tools with quick-start actions |
| **Smart Email Generator** | Recipient, topic and tone (Formal / Friendly / Persuasive) -> polished, editable draft |
| **Meeting Notes Summarizer** | Raw notes -> Summary, Action Items, Decisions and Deadlines in structured editable cards |
| **AI Task Planner** | To-do list + available hours + working style -> prioritised, time-blocked plan |
| **AI Research Assistant** | Any topic -> Overview, Key Points, Practical Takeaways and Next Steps |
| **Workplace Assistant Chat** | Chat with message history, typing indicator and Clear chat |

Also included: loading spinners on every AI action, copy-to-clipboard everywhere,
toast notifications, mobile-responsive sidebar layout, and a Responsible AI
disclaimer in the footer.

## Prompt engineering

Each tool uses its own tuned system prompt with a strict output contract, so the
UI can parse and display results reliably:

- **Email** — role + "output a Subject line then the body, no commentary".
- **Meetings** — must reply with exactly four uppercase headings (`SUMMARY:`,
  `ACTION ITEMS:`, `DECISIONS:`, `DEADLINES:`) using `- ` bullets, so the app can
  split the answer into cards.
- **Planner** — one task per line in a fixed format
  (`PRIORITY n — task · Est. m min · when · Why: reason`) plus a single `TIP:` line.
- **Research** — fixed headings, factual tone, must flag uncertainty and never
  invent statistics or citations.
- **Chat** — persona ("Workplace Assistant"), scope and brevity constraints, with
  the full conversation history sent on every turn.

## Responsible AI

- Footer disclaimer on every screen: outputs may be inaccurate, review before use,
  don't share confidential data, keep a human in the loop.
- All outputs are editable — the AI drafts, the human decides.
- The research tool explicitly warns against unverified facts and is instructed not
  to fabricate sources.
- No user data is stored; nothing is persisted to a database.
- The AI key is server-side only and never exposed to the browser.

## Tech stack

- TanStack Start (React 19) + TypeScript
- Tailwind CSS v4 with a semantic design-token theme
- shadcn/ui components, lucide icons, sonner toasts
- Lovable AI Gateway (`google/gemini-3.6-flash`) called from server functions
- Built with Lovable

## How the AI is wired

`src/lib/ai.functions.ts` exposes five server functions (`generateEmail`,
`summarizeNotes`, `planTasks`, `researchTopic`, `chatReply`). They call the Lovable
AI Gateway with `LOVABLE_API_KEY`, which is read server-side only. Rate-limit,
credit and access errors are surfaced to the UI as clear messages.

**Mock mode:** if no API key is configured, each function returns a realistic dummy
response and the UI shows a "Mock response" toast, so the app is fully demoable
offline.

## Run locally

Requires Node.js and npm.

```sh
git clone <this-repository-url>
cd ai-skills-acceleration
npm install
npm run dev
```

The app runs at http://localhost:8080.

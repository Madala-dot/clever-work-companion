import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callAI(messages: Msg[]): Promise<{ text: string; mock: boolean }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { text: mockFor(messages), mock: true };

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("AI is rate limited right now. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Add credits to continue.");
    if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
    throw new Error(`AI request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI returned an empty response.");
  return { text, mock: false };
}

function mockFor(messages: Msg[]): string {
  const last = messages[messages.length - 1]?.content ?? "";
  if (last.includes("MEETING NOTES")) {
    return [
      "SUMMARY: The team reviewed current progress, aligned on priorities and agreed on the next milestone.",
      "ACTION ITEMS:",
      "- Draft the updated project plan (Owner: Project lead)",
      "- Share the latest metrics with stakeholders (Owner: Analyst)",
      "DECISIONS:",
      "- Proceed with the proposed scope for this iteration",
      "DEADLINES:",
      "- Project plan circulated by end of week",
    ].join("\n");
  }
  if (last.includes("Write a workplace email")) {
    return "Subject: Following up\n\nHello,\n\nI hope this message finds you well. I wanted to follow up on the topic below and share a short update, along with next steps for your review.\n\nPlease let me know if you'd like any changes.\n\nBest regards,\n[Your name]\n\n(Mock response — no AI key configured.)";
  }
  if (last.includes("TASKS TO PLAN")) {
    return [
      "PRIORITY 1 — Finish the client proposal · Est. 90 min · Today 09:00–10:30 · Why: hard deadline and highest impact",
      "PRIORITY 2 — Review team metrics · Est. 45 min · Today 11:00–11:45 · Why: needed before tomorrow's stand-up",
      "PRIORITY 3 — Reply to outstanding emails · Est. 30 min · Today 14:00–14:30 · Why: unblocks other people",
      "PRIORITY 4 — Update project documentation · Est. 60 min · Tomorrow 09:00–10:00 · Why: important but not urgent",
      "TIP: Protect the first 90 minutes for deep work and batch all email into one slot.",
      "(Mock response — no AI key configured.)",
    ].join("\n");
  }
  if (last.includes("RESEARCH TOPIC")) {
    return [
      "OVERVIEW: A concise orientation to the topic, what it covers and why it matters at work right now.",
      "KEY POINTS:",
      "- The core idea and the problem it solves",
      "- The main approaches used in practice today",
      "- Common pitfalls teams run into",
      "PRACTICAL TAKEAWAYS:",
      "- Start small with one measurable pilot",
      "- Document assumptions so results can be reviewed",
      "NEXT STEPS:",
      "- Verify these points against a primary source before sharing",
      "(Mock response — no AI key configured.)",
    ].join("\n");
  }
  return "Thanks for your message! I'm the Workplace Assistant running in mock mode. Ask me about drafting emails, planning meetings, or organising your day.";
}

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        tasks: z.string().min(1),
        hours: z.string(),
        style: z.enum(["Balanced", "Deep focus", "Meeting heavy"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAI([
      {
        role: "system",
        content:
          "You are an expert workplace task planner. Prioritise tasks by impact and urgency and build a realistic schedule. Reply in plain text, one item per line, formatted exactly as: 'PRIORITY <n> — <task> · Est. <minutes> min · <when> · Why: <one short reason>'. After the list add a single line starting with 'TIP: '. No other commentary.",
      },
      {
        role: "user",
        content: `TASKS TO PLAN:\n${data.tasks}\n\nAvailable working hours today: ${data.hours || "unspecified"}\nPreferred working style: ${data.style}`,
      },
    ]);
  });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().min(1),
        depth: z.enum(["Quick brief", "Standard", "In depth"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAI([
      {
        role: "system",
        content:
          "You are a careful workplace research assistant. Reply in plain text using exactly these uppercase headings on their own lines: OVERVIEW:, KEY POINTS:, PRACTICAL TAKEAWAYS:, NEXT STEPS:. Use '- ' bullets under the list headings. Be factual, flag uncertainty explicitly, and never invent statistics, citations or sources.",
      },
      {
        role: "user",
        content: `RESEARCH TOPIC: ${data.topic}\nDepth: ${data.depth}`,
      },
    ]);
  });


export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        recipient: z.string(),
        topic: z.string().min(1),
        tone: z.enum(["Formal", "Friendly", "Persuasive"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAI([
      {
        role: "system",
        content:
          "You are a professional workplace writing assistant. Write concise, well-structured business emails. Output a Subject line then the body. No commentary.",
      },
      {
        role: "user",
        content: `Write a workplace email.\nRecipient: ${data.recipient || "the recipient"}\nTone: ${data.tone}\nTopic: ${data.topic}`,
      },
    ]);
  });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ notes: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    return callAI([
      {
        role: "system",
        content:
          "You summarize meeting notes. Reply in plain text with exactly these four uppercase headings on their own lines: SUMMARY:, ACTION ITEMS:, DECISIONS:, DEADLINES:. Use '- ' bullets under the list headings. If a section has nothing, write '- None noted'.",
      },
      { role: "user", content: `MEETING NOTES:\n${data.notes}` },
    ]);
  });

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return callAI([
      {
        role: "system",
        content:
          "You are 'Workplace Assistant', a helpful, concise assistant for workplace productivity: email drafting, meeting prep, prioritisation and planning. Keep answers practical and short.",
      },
      ...data.messages,
    ]);
  });

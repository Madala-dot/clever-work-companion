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
  return "Thanks for your message! I'm the Workplace Assistant running in mock mode. Ask me about drafting emails, planning meetings, or organising your day.";
}

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

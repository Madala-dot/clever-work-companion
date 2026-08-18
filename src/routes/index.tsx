import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Mail,
  NotebookPen,
  MessageSquare,
  Copy,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateEmail, summarizeNotes, chatReply } from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Draft emails, summarize meeting notes and chat with an AI workplace assistant in one clean, professional workspace.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, summarize meeting notes and chat with an AI workplace assistant in one clean workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Section = "dashboard" | "email" | "meetings" | "chat";

const NAV: { id: Section; label: string; icon: typeof Mail }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "email", label: "Email", icon: Mail },
  { id: "meetings", label: "Meetings", icon: NotebookPen },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

async function copy(text: string) {
  if (!text.trim()) return toast.error("Nothing to copy yet.");
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Copy failed — select the text manually.");
  }
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}

function App() {
  const [section, setSection] = useState<Section>("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-sidebar-border bg-sidebar md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0 md:sticky md:top-0">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-9 items-center justify-center rounded-lg text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="size-5" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Workplace AI</p>
                <p className="text-xs text-muted-foreground">Productivity suite</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle navigation"
              onClick={() => setNavOpen((v) => !v)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
          <nav className={cn("px-3 pb-4 md:block", navOpen ? "block" : "hidden")}>
            <ul className="space-y-1">
              {NAV.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    onClick={() => {
                      setSection(id);
                      setNavOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      section === id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                    aria-current={section === id ? "page" : undefined}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
            {section === "dashboard" && <Dashboard onGo={setSection} />}
            {section === "email" && <EmailGenerator />}
            {section === "meetings" && <MeetingSummarizer />}
            {section === "chat" && <Chatbot />}
          </main>
          <footer className="border-t border-border bg-card px-4 py-5 md:px-8">
            <p className="mx-auto flex max-w-4xl items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <strong className="font-semibold text-foreground">Responsible AI:</strong> outputs
                are AI-generated and may be inaccurate or incomplete. Always review and edit before
                sending, avoid sharing confidential or personal data, and keep a human in the loop
                for decisions.
              </span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </header>
  );
}

function Dashboard({ onGo }: { onGo: (s: Section) => void }) {
  return (
    <div>
      <PageHeader
        title="AI Workplace Productivity Assistant"
        subtitle="Draft emails, turn messy notes into decisions, and ask your assistant anything."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {NAV.filter((n) => n.id !== "dashboard").map(({ id, label, icon: Icon }) => (
          <Card key={id} className="shadow-none transition-shadow hover:shadow-md">
            <CardHeader>
              <Icon className="size-5 text-primary" />
              <CardTitle className="text-base">
                {id === "email"
                  ? "Smart Email Generator"
                  : id === "meetings"
                    ? "Meeting Notes Summarizer"
                    : "Workplace Assistant Chat"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {id === "email"
                  ? "Pick a tone and topic — get a polished, editable draft."
                  : id === "meetings"
                    ? "Extract summary, action items, decisions and deadlines."
                    : "Ask questions, plan work, and get quick guidance."}
              </p>
              <Button className="mt-4 w-full" variant="secondary" onClick={() => onGo(id)}>
                Open {label}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmailGenerator() {
  const run = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"Formal" | "Friendly" | "Persuasive">("Formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (!topic.trim()) return toast.error("Add a topic first.");
    setLoading(true);
    try {
      const res = await run({ data: { recipient, topic, tone } });
      setOutput(res.text);
      if (res.mock) toast.info("Mock response (no AI key configured).");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Smart Email Generator" subtitle="Generate a draft, then edit it freely." />
      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="recipient">Recipient email</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="alex@company.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic</Label>
            <Textarea
              id="topic"
              rows={3}
              placeholder="Request a project update ahead of Friday's steering committee."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <Button onClick={onGenerate} disabled={loading} className="sm:w-fit">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Generating…" : "Generate email"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Draft (editable)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => copy(output)}>
            <Copy className="size-4" /> Copy
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={14}
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Your generated email will appear here — fully editable."
          />
        </CardContent>
      </Card>
    </div>
  );
}

type Parsed = { summary: string; actions: string[]; decisions: string[]; deadlines: string[] };

function parseSummary(text: string): Parsed {
  const sections: Record<string, string[]> = {
    SUMMARY: [],
    "ACTION ITEMS": [],
    DECISIONS: [],
    DEADLINES: [],
  };
  let current = "SUMMARY";
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^[*#\s]+/, "").trim();
    if (!line) continue;
    const head = Object.keys(sections).find((k) =>
      line.toUpperCase().replace(/\*/g, "").startsWith(k + ":"),
    );
    if (head) {
      current = head;
      const rest = line.slice(line.indexOf(":") + 1).trim();
      if (rest) sections[head].push(rest);
      continue;
    }
    sections[current].push(line.replace(/^[-•]\s*/, ""));
  }
  return {
    summary: sections.SUMMARY.join(" "),
    actions: sections["ACTION ITEMS"],
    decisions: sections.DECISIONS,
    deadlines: sections.DEADLINES,
  };
}

function MeetingSummarizer() {
  const run = useServerFn(summarizeNotes);
  const [notes, setNotes] = useState("");
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const parsed = useMemo(() => (raw ? parseSummary(raw) : null), [raw]);

  async function onSummarize() {
    if (!notes.trim()) return toast.error("Paste some meeting notes first.");
    setLoading(true);
    try {
      const res = await run({ data: { notes } });
      setRaw(res.text);
      if (res.mock) toast.info("Mock response (no AI key configured).");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Meeting Notes Summarizer"
        subtitle="Turn raw notes into a summary, action items, decisions and deadlines."
      />
      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="notes">Raw meeting notes</Label>
            <Textarea
              id="notes"
              rows={10}
              placeholder="Paste your notes or transcript here…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button onClick={onSummarize} disabled={loading} className="sm:w-fit">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <NotebookPen className="size-4" />
            )}
            {loading ? "Summarizing…" : "Summarize notes"}
          </Button>
        </CardContent>
      </Card>

      {parsed && (
        <div className="mt-4 grid gap-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => copy(raw)}>
              <Copy className="size-4" /> Copy all
            </Button>
          </div>
          <EditableCard
            title="Summary"
            value={parsed.summary}
            rows={4}
            onChange={(v) => setRaw(rebuild({ ...parsed, summary: v }))}
          />
          <EditableCard
            title="Action items"
            value={parsed.actions.join("\n")}
            rows={5}
            onChange={(v) => setRaw(rebuild({ ...parsed, actions: v.split("\n") }))}
          />
          <EditableCard
            title="Decisions"
            value={parsed.decisions.join("\n")}
            rows={4}
            onChange={(v) => setRaw(rebuild({ ...parsed, decisions: v.split("\n") }))}
          />
          <EditableCard
            title="Deadlines"
            value={parsed.deadlines.join("\n")}
            rows={4}
            onChange={(v) => setRaw(rebuild({ ...parsed, deadlines: v.split("\n") }))}
          />
        </div>
      )}
    </div>
  );
}

function rebuild(p: Parsed) {
  const list = (items: string[]) =>
    items
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => `- ${i}`)
      .join("\n");
  return [
    `SUMMARY: ${p.summary}`,
    `ACTION ITEMS:\n${list(p.actions)}`,
    `DECISIONS:\n${list(p.decisions)}`,
    `DEADLINES:\n${list(p.deadlines)}`,
  ].join("\n");
}

function EditableCard({
  title,
  value,
  rows,
  onChange,
}: {
  title: string;
  value: string;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => copy(value)}>
          <Copy className="size-4" /> Copy
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      </CardContent>
    </Card>
  );
}

type ChatMsg = { role: "user" | "assistant"; content: string };

function Chatbot() {
  const run = useServerFn(chatReply);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hi, I'm your Workplace Assistant. How can I help you get things done today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await run({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.text }]);
      if (res.mock) toast.info("Mock response (no AI key configured).");
    } catch (e) {
      toast.error(errMsg(e));
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry — I couldn't reply just now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Workplace Assistant" subtitle="Ask anything about your work day." />
      <Card className="flex h-[60vh] min-h-96 flex-col">
        <CardHeader className="flex-row items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Workplace Assistant</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setMessages([
                { role: "assistant", content: "Chat cleared. What would you like to work on?" },
              ])
            }
          >
            <Trash2 className="size-4" /> Clear chat
          </Button>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-y-auto py-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Workplace Assistant is typing…
            </div>
          )}
          <div ref={endRef} />
        </CardContent>
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Input
            value={input}
            placeholder="Type your message…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <Button onClick={send} disabled={loading} aria-label="Send message">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}

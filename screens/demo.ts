// A demo workspace for Octopus's real frontend: every Tauri command is answered from the data below,
// so the UI renders as in the app without touching anyone's projects. Scenes (scenes.ts) then set the
// workbench up for each screenshot. Nothing here is real: names, tasks and code are made up.

import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { spawnQueue } from "./state";

const now = Date.now();
const min = 60_000;
const hour = 60 * min;
const day = 24 * hour;
const iso = (t: number) => new Date(t).toISOString();

// ---------------------------------------------------------------------------------------------
// Projects and tasks

const P = (id: string, name: string, color: string, position: number) => ({
  id,
  name,
  path: `/Users/alex/code/${name}`,
  docsDir: "docs",
  color,
  position,
  createdAt: now - 90 * day,
  storage: "repo",
  claudeConfig: "",
});

export const projects = [
  P("p-checkout", "checkout", "#a083ff", 0),
  P("p-mobile", "mobile-app", "#4fb6a5", 1),
  P("p-billing", "billing-api", "#e0a35b", 2),
  P("p-design", "design-system", "#6aa7f0", 3),
];

let seq = 0;
const T = (
  projectId: string | null,
  title: string,
  status: string,
  priority: number,
  tags: string[] = [],
  extra: Record<string, unknown> = {},
) => {
  seq += 1;
  return {
    id: `t-${seq}`,
    projectId,
    title,
    description: "",
    status,
    priority,
    position: seq,
    createdAt: now - (40 - seq) * day,
    updatedAt: now - seq * hour,
    completedAt: status === "done" ? now - seq * hour : null,
    file: projectId ? `.octopus/tasks/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${seq}.md` : null,
    tags,
    run: "",
    page: "",
    board: "",
    projects: [],
    ...extra,
  };
};

export const tasks = [
  T("p-checkout", "Fix the login redirect", "doing", 2, ["auth"], {
    description:
      "After sign-in, users land on `/` instead of the page they came from.\n\n- [x] Keep `next` through the OAuth round trip\n- [x] Reject redirects to other hosts\n- [ ] Cover it with a test\n\nSee [Auth design](octopus://doc/docs/auth.md).",
    run: "npm test -- auth",
  }),
  T("p-checkout", "Add Apple Pay to the payment step", "doing", 2, ["payments"]),
  T("p-checkout", "Refactor cart totals into one module", "review", 1, ["cart"]),
  T("p-checkout", "Show saved cards first", "todo", 1, ["payments"]),
  T("p-checkout", "Validate postcodes for the UK and Ireland", "todo", 0, ["address"]),
  T("p-checkout", "Gift cards: partial payments", "todo", 3, ["payments"]),
  T("p-checkout", "Explain why a coupon doesn't apply", "todo", 1, ["cart", "copy"]),
  T("p-checkout", "Retry failed webhooks with backoff", "review", 2, ["payments"]),
  T("p-checkout", "Move address autocomplete to the new API", "done", 1, ["address"]),
  T("p-checkout", "Trim the bundle under 180 kB", "done", 0, ["perf"]),
  T("p-mobile", "Dark mode for the order screen", "todo", 1, ["ui"]),
  T("p-mobile", "Crash on Android 14 when the camera opens", "doing", 3, ["bug"]),
  T("p-billing", "Invoices in the customer's currency", "todo", 2, ["invoices"]),
  T("p-billing", "Prorate plan changes mid-cycle", "review", 1, []),
  T("p-design", "Focus rings that pass WCAG", "todo", 2, ["a11y"]),
  T(null, "Renew the Apple Developer membership", "todo", 2, []),
  T(null, "Write the Q4 roadmap", "doing", 1, []),
];

// ---------------------------------------------------------------------------------------------
// Terminals: what each spawned PTY "prints". Claude Code's look, roughly.

const esc = (code: string) => `\x1b[${code}m`;
const dim = (s: string) => `${esc("2")}${s}${esc("22")}`;
const bold = (s: string) => `${esc("1")}${s}${esc("22")}`;
const fg = (rgb: [number, number, number], s: string) => `${esc(`38;2;${rgb.join(";")}`)}${s}${esc("39")}`;
const orange: [number, number, number] = [215, 119, 87];
const green: [number, number, number] = [78, 201, 138];
const red: [number, number, number] = [240, 110, 110];
const grey: [number, number, number] = [140, 140, 150];
const nl = "\r\n";

// Visible width of a string with ANSI codes, to draw boxes that close.
const visible = (t: string) => t.replace(/\x1b\[[0-9;]*m/g, "").length;
const box = (lines: string[], width: number, paint: (t: string) => string) =>
  [
    paint("╭" + "─".repeat(width) + "╮"),
    ...lines.map((l) => paint("│") + " " + l + " ".repeat(Math.max(0, width - 1 - visible(l))) + paint("│")),
    paint("╰" + "─".repeat(width) + "╯"),
  ].join(nl);

const claudeHeader = (cwd: string) =>
  box([fg(orange, "✻") + " Welcome to " + bold("Claude Code") + "!", "", dim(`  cwd: ${cwd}`)], 46, (t) => fg(orange, t)) + nl;

const prompt = (hint = "") => nl + box(["> " + dim(hint)], 76, dim) + nl + dim("  ? for shortcuts");

export const transcripts: Record<string, string> = {
  login: [
    claudeHeader("~/code/checkout"),
    fg(grey, "> ") + "Fix the login redirect",
    fg(grey, "  After sign-in, users land on / instead of the page they came from. Read docs/auth.md."),
    "",
    "⏺ " + bold("Read") + "(docs/auth.md)",
    dim("  ⎿  Read 84 lines"),
    "",
    "⏺ " + bold("Search") + '(pattern: "redirect\\(", path: "src/auth")',
    dim("  ⎿  Found 3 files"),
    "",
    "⏺ The callback ignores the " + fg(orange, "next") + " parameter and always sends users to /. I'll keep it",
    "  through the OAuth round trip and only allow paths on our own host.",
    "",
    "⏺ " + bold("Update") + "(src/auth/redirect.ts)",
    dim("  ⎿  Updated src/auth/redirect.ts with 6 additions and 2 removals"),
    "     " + dim("12") + fg(red, " -  return redirect(\"/\")"),
    "     " + dim("12") + fg(green, " +  const next = safeNext(params.get(\"next\"))"),
    "     " + dim("13") + fg(green, " +  return redirect(next ?? \"/\")"),
    "",
    "⏺ " + bold("Bash") + "(npm test -- auth)",
    dim("  ⎿  ") + fg(green, "✓") + " 14 passed " + dim("(1.2s)"),
    "",
    fg(orange, "✻ ") + fg(orange, "Writing the test for cross-host redirects…") + dim(" (38s · ↓ 1.4k tokens · esc to interrupt)"),
    prompt(),
  ].join(nl),
  applepay: [
    claudeHeader("~/code/checkout"),
    fg(grey, "> ") + "Add Apple Pay to the payment step",
    "",
    "⏺ " + bold("Read") + "(src/payment/methods.tsx)",
    dim("  ⎿  Read 212 lines"),
    "",
    "⏺ Apple Pay needs the merchant domain verified first. Should I add the",
    "  verification file to " + fg(orange, "public/.well-known") + ", or is that handled by the",
    "  infrastructure team?",
    prompt(),
  ].join(nl),
  cart: [
    claudeHeader("~/code/checkout"),
    fg(grey, "> ") + "Refactor cart totals into one module",
    "",
    "⏺ Done. " + bold("src/cart/totals.ts") + " now computes subtotal, discounts, tax and shipping;",
    "  the three components that did it themselves use it. 31 tests pass.",
    prompt("Ask Claude to…"),
  ].join(nl),
  shell: [
    fg(green, "alex@mbp") + " " + fg([106, 167, 240], "~/code/checkout") + " " + fg(grey, "(main)") + " $ npm run dev",
    "",
    "  " + fg(green, "VITE v6.3.5") + "  ready in " + bold("412 ms"),
    "",
    "  " + fg(green, "➜") + "  " + bold("Local") + ":   " + fg([106, 167, 240], "http://localhost:5173/"),
    "  " + fg(green, "➜") + "  " + dim("Network: use --host to expose"),
    "",
  ].join(nl),
};

const ptyBusy: Record<string, { sessionId: string; busy: boolean }> = {};
let ptySeq = 0;

// ---------------------------------------------------------------------------------------------
// Terminals in other apps

const external = [
  {
    key: "ext-1",
    tty: "ttys004",
    app: "Visual Studio Code",
    appPath: "/Applications/Visual Studio Code.app",
    command: "claude",
    cwd: "/Users/alex/code/billing-api",
    title: null,
    claude: { sessionId: "c-ext-1", title: "Prorate plan changes mid-cycle", lastActivity: now - 20_000, configDir: "" },
    cpu: 12,
    alias: null,
    projectId: "p-billing",
    link: "auto",
    taskId: null,
  },
  {
    key: "ext-2",
    tty: "ttys006",
    app: "iTerm2",
    appPath: "/Applications/iTerm.app",
    command: "claude",
    cwd: "/Users/alex/code/mobile-app",
    title: "✳ Android camera crash",
    claude: { sessionId: "c-ext-2", title: "Crash on Android 14 when the camera opens", lastActivity: now - 4 * min, configDir: "" },
    cpu: 0,
    alias: null,
    projectId: "p-mobile",
    link: "auto",
    taskId: null,
  },
  {
    key: "ext-3",
    tty: "ttys002",
    app: "Ghostty",
    appPath: "/Applications/Ghostty.app",
    command: "zsh",
    cwd: "/Users/alex/code/design-system",
    title: "npm run storybook",
    claude: null,
    cpu: 3,
    alias: null,
    projectId: "p-design",
    link: "auto",
    taskId: null,
  },
];

// ---------------------------------------------------------------------------------------------
// Documentation

const docs: Record<string, string> = {
  "README.md": "# checkout\n\nThe checkout flow: cart, address, payment, confirmation.\n",
  "docs/auth.md": `# Auth design

How a customer signs in during checkout, and where they land afterwards.

## Flow

1. A signed-out customer opens \`/payment\` and is sent to \`/login?next=/payment\`.
2. Sign-in goes through the identity provider (OAuth), carrying \`next\` in \`state\`.
3. The callback checks \`next\` and sends the customer back to it.

## Redirects after sign-in

The page the customer came from travels in \`next\`, through the OAuth \`state\`.
Only **relative paths on our own host** are accepted: anything else falls back to \`/\`.

| Case | next | Lands on |
| --- | --- | --- |
| From the payment step | \`/payment\` | \`/payment\` |
| Missing | — | \`/\` |
| Another host | \`https://evil.example\` | \`/\` |

## Sessions

- Cookie \`sid\`, HttpOnly, SameSite=Lax, 30 days.
- Refreshed on every request after half its life.
- Signing out clears it on every device.

> Open question: should guests keep their cart when they sign in on another device?
`,
  "docs/payments.md": "# Payments\n\nCards, Apple Pay and gift cards.\n",
  "docs/release.md": "# Releasing\n\n1. Bump the version.\n2. Tag it.\n",
  "docs/adr/001-stripe.md": "# ADR 001: Stripe\n",
  "docs/adr/002-totals.md": "# ADR 002: One module for totals\n",
};

const docTree = {
  docsDir: "docs",
  docsDirExists: true,
  rootFiles: [{ path: "README.md", modified: now - 3 * day, size: 120 }],
  files: Object.keys(docs)
    .filter((p) => p.startsWith("docs/"))
    .map((path, i) => ({ path, modified: now - i * day, size: docs[path].length })),
};

// ---------------------------------------------------------------------------------------------
// Git

const gitFiles = [
  { path: "src/auth/redirect.ts", origPath: null, staged: null, unstaged: "M", conflicted: false, local: "src/auth/redirect.ts" },
  { path: "src/auth/callback.ts", origPath: null, staged: null, unstaged: "M", conflicted: false, local: "src/auth/callback.ts" },
  { path: "src/auth/redirect.test.ts", origPath: null, staged: null, unstaged: "?", conflicted: false, local: "src/auth/redirect.test.ts" },
  { path: "docs/auth.md", origPath: null, staged: "M", unstaged: null, conflicted: false, local: "docs/auth.md" },
];

const redirectBefore = `import { redirect } from "../http";
import { session } from "./session";

/** Where a customer goes once signed in. */
export function afterSignIn(params: URLSearchParams) {
  const user = session.current();
  if (!user) return redirect("/login");

  // TODO: send them back where they came from
  return redirect("/");
}

export function afterSignOut() {
  session.clear();
  return redirect("/");
}
`;

const redirectAfter = `import { redirect } from "../http";
import { session } from "./session";

/** A path on this host to go back to, or null: never another site. */
export function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Where a customer goes once signed in: back where they came from. */
export function afterSignIn(params: URLSearchParams) {
  const user = session.current();
  if (!user) return redirect("/login");

  const next = safeNext(params.get("next"));
  return redirect(next ?? "/");
}

export function afterSignOut() {
  session.clear();
  return redirect("/");
}
`;

const commits = [
  ["Keep the cart when a guest signs in", "Priya Shah", 2 * hour],
  ["Address autocomplete on the new places API", "Alex Morgan", 5 * hour],
  ["Bundle: lazy-load the gift card form", "Alex Morgan", 1 * day],
  ["Retry webhooks with exponential backoff", "Sam Lee", 1 * day + 3 * hour],
  ["Merge branch 'payments/apple-pay-spike'", "Sam Lee", 2 * day],
  ["Totals: one rounding rule for every currency", "Priya Shah", 2 * day + 4 * hour],
  ["Payment step: show saved cards in a list", "Alex Morgan", 3 * day],
  ["Upgrade to React 19", "Alex Morgan", 4 * day],
  ["Postcode lookup behind a feature flag", "Sam Lee", 5 * day],
  ["Initial checkout flow", "Alex Morgan", 30 * day],
].map(([subject, author, ago], i) => ({
  hash: (i + 1).toString(16).padStart(2, "0").repeat(20),
  short: (0x3a7f1 + i * 977).toString(16).slice(0, 7),
  author,
  email: `${String(author).split(" ")[0].toLowerCase()}@example.com`,
  date: iso(now - (ago as number)),
  subject,
}));

// ---------------------------------------------------------------------------------------------
// Notebooks

const text = (t: string, styles: Record<string, unknown> = {}) => ({ type: "text", text: t, styles });
let blockSeq = 0;
const block = (type: string, content: unknown[] | string = [], props: Record<string, unknown> = {}, children: unknown[] = []) => ({
  id: `b-${++blockSeq}`,
  type,
  props,
  content: typeof content === "string" ? [text(content)] : content,
  children,
});

const pageMeta = (id: string, title: string, icon: string, parent: string | null, position: number, extra: Record<string, unknown> = {}) => ({
  id,
  title,
  icon,
  parent,
  position,
  createdAt: now - 20 * day,
  updatedAt: now - position * hour,
  kind: "page",
  props: {},
  contentRev: `rev-${id}`,
  task: null,
  ...extra,
});

const pages: Record<string, ReturnType<typeof pageMeta> & { content: unknown[]; database: unknown }> = {};
const addPage = (meta: ReturnType<typeof pageMeta>, content: unknown[] = [], database: unknown = null) =>
  (pages[meta.id] = { ...meta, content, database });

addPage(pageMeta("pg-spec", "Payment step redesign", "💳", null, 0), [
  block("paragraph", [
    text("Goal: fewer abandoned carts at the payment step. Today "),
    text("31%", { bold: true }),
    text(" of customers who reach it leave without paying."),
  ]),
  block("heading", "What changes", { level: 2 }),
  block("bulletListItem", "Saved cards first, the last one used preselected"),
  block("bulletListItem", "Apple Pay and Google Pay above the card form"),
  block("bulletListItem", "Coupon errors say why the coupon doesn't apply"),
  block("heading", "Tasks", { level: 2 }),
  block("task", [], { taskId: "t-4" }),
  block("task", [], { taskId: "t-2" }),
  block("task", [], { taskId: "t-7" }),
  block("heading", "Open questions", { level: 2 }),
  block("checkListItem", "Do we keep PayPal in the first release?", { checked: true }),
  block("checkListItem", "Who owns the merchant domain verification?", { checked: false }),
]);
addPage(pageMeta("pg-meetings", "Meeting notes", "🗓️", null, 1));
addPage(pageMeta("pg-meet-1", "Payments sync, 6 Oct", "", "pg-meetings", 0));
addPage(pageMeta("pg-meet-2", "Kickoff with design", "", "pg-meetings", 1));
addPage(pageMeta("pg-research", "Checkout research", "🔎", null, 2));
addPage(pageMeta("pg-ideas", "Ideas", "💡", null, 3));

const props: unknown[] = [
  {
    id: "status",
    name: "Status",
    type: "status",
    options: [
      { id: "s1", name: "Not started", color: "gray" },
      { id: "s2", name: "In progress", color: "blue" },
      { id: "s3", name: "Shipped", color: "green" },
    ],
  },
  {
    id: "area",
    name: "Area",
    type: "select",
    options: [
      { id: "a1", name: "Payments", color: "purple" },
      { id: "a2", name: "Cart", color: "orange" },
      { id: "a3", name: "Address", color: "blue" },
    ],
  },
  { id: "impact", name: "Impact", type: "number" },
  { id: "due", name: "Due", type: "date" },
];
addPage(pageMeta("pg-db", "Experiments", "🧪", null, 4, { kind: "database" }), [], {
  properties: props,
  views: [
    { id: "v-board", name: "Board", type: "board", groupBy: "status", filters: [], sorts: [], hidden: [] },
    { id: "v-table", name: "Table", type: "table", filters: [], sorts: [], hidden: [] },
  ],
});
[
  ["One-tap reorder", "s2", "a2", 8, "2026-10-20"],
  ["Wallets above the card form", "s2", "a1", 13, "2026-10-14"],
  ["Postcode first, then street", "s1", "a3", 5, "2026-11-02"],
  ["Coupon reasons", "s1", "a2", 3, "2026-11-10"],
  ["Remember the last card", "s3", "a1", 9, "2026-09-30"],
  ["Free shipping progress bar", "s3", "a2", 6, "2026-09-18"],
].forEach(([title, status, area, impact, due], i) =>
  addPage(pageMeta(`pg-row-${i}`, title as string, "", "pg-db", i, { props: { status, area, impact, due } })),
);

// ---------------------------------------------------------------------------------------------
// Extensions and marketplaces

const perms = (p: Partial<{ http: string[]; claude: boolean; tasks: boolean; docs: boolean }>) => ({
  http: [],
  claude: false,
  tasks: false,
  docs: false,
  ...p,
});

const extensions = [
  {
    id: "log-explorer",
    name: "Log explorer",
    description: "Search checkout logs, group errors with Claude, file tasks",
    icon: "pulse",
    path: "/Users/alex/.octopus/extensions/log-explorer",
    entry: "index.html",
    permissions: perms({ http: ["https://logs.internal/api/"], claude: true, tasks: true }),
    trusted: true,
    problem: null,
    version: "1.2.0",
    author: "Alex Morgan",
    enabled: true,
    marketplace: "team-extensions",
    published: null,
  },
  {
    id: "release-notes",
    name: "Release notes",
    description: "Drafts release notes from merged pull requests",
    icon: "notebook",
    path: "/Users/alex/.octopus/extensions/release-notes",
    entry: "index.html",
    permissions: perms({ http: ["https://api.github.com/"], claude: true, docs: true }),
    trusted: true,
    problem: null,
    version: "0.4.1",
    author: "Priya Shah",
    enabled: true,
    marketplace: "team-extensions",
    published: null,
  },
];

const marketplaces = [
  {
    name: "team-extensions",
    description: "Extensions the checkout team shares",
    source: "git@github.com:acme/octopus-extensions.git",
    local: false,
    problem: null,
    extensions: [
      { id: "log-explorer", name: "Log explorer", description: "Search checkout logs, group errors with Claude, file tasks", icon: "pulse", version: "1.2.0", author: "Alex Morgan", permissions: perms({ http: ["https://logs.internal/api/"], claude: true, tasks: true }), hasReadme: true },
      { id: "release-notes", name: "Release notes", description: "Drafts release notes from merged pull requests", icon: "notebook", version: "0.4.1", author: "Priya Shah", permissions: perms({ http: ["https://api.github.com/"], claude: true, docs: true }), hasReadme: true },
      { id: "feature-flags", name: "Feature flags", description: "Flip the team's flags per environment, with a diff before saving", icon: "settings", version: "2.0.0", author: "Sam Lee", permissions: perms({ http: ["https://flags.internal/"] }), hasReadme: true },
      { id: "on-call", name: "On-call", description: "Who's on call this week, open incidents, and a task per follow-up", icon: "bell", version: "1.0.3", author: "Sam Lee", permissions: perms({ http: ["https://pager.internal/"], tasks: true }), hasReadme: false },
      { id: "sql-scratch", name: "SQL scratchpad", description: "Ask Claude for a query, run it on the read replica, chart it", icon: "database", version: "0.9.0", author: "Priya Shah", permissions: perms({ http: ["https://replica.internal/"], claude: true }), hasReadme: true },
      { id: "standup", name: "Standup", description: "Yesterday's done tasks and today's in progress, ready to paste", icon: "comment-discussion", version: "1.1.0", author: "Alex Morgan", permissions: perms({ tasks: true }), hasReadme: false },
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// The mocked backend

const settings: Record<string, string> = { theme: "dark", autoReview: "false" };

const handlers: Record<string, (a: any) => unknown> = {
  projects_list: () => projects,
  tasks_list: () => tasks,
  settings_get: () => settings,
  setting_set: (a) => void (settings[a.key] = a.value),
  project_meta: () => ({ exists: true, gitBranch: "main", hasClaudeMd: true }),
  task_update: (a) => {
    const t = tasks.find((x) => x.id === a.id)!;
    Object.assign(t, a.patch, { updatedAt: Date.now() });
    return t;
  },
  task_sessions: () => [],
  task_runs: (a) =>
    a.taskId === "t-1"
      ? [
          { id: "r1", taskId: "t-1", command: "npm test -- auth", startedAt: now - 9 * min, finishedAt: now - 9 * min + 4000, exitCode: 0 },
          { id: "r2", taskId: "t-1", command: "npm test -- auth", startedAt: now - 52 * min, finishedAt: now - 52 * min + 3000, exitCode: 1 },
        ]
      : [],
  links_backlinks: (a) =>
    a.target?.kind === "task" && a.target.id === "t-1"
      ? [{ from: { kind: "page", id: "pg-spec" }, projectId: "p-checkout", title: "Payment step redesign", icon: "💳", snippets: ["…sign-in has to come back to the payment step…"] }]
      : [],
  command_approved: () => true,
  claude_accounts: () => [],
  claude_conversations: () => [],
  claude_recent: () => [],
  claude_conversation: () => null,
  external_terminals: () => external,

  pty_spawn: (a) => {
    const id = `pty-${++ptySeq}`;
    const next = spawnQueue.shift() ?? { transcript: "shell", busy: false };
    ptyBusy[id] = { sessionId: `c-${id}`, busy: next.busy };
    const bytes = Array.from(new TextEncoder().encode(transcripts[next.transcript] ?? ""));
    setTimeout(() => a.onData.onmessage(bytes), 300);
    return id;
  },
  pty_claude_states: () => ptyBusy,
  pty_write: () => null,
  pty_resize: () => null,
  pty_kill: () => null,
  pty_kill_all: () => null,

  mido_detect: () => ({ available: false, version: null, appPath: null, embedPath: null, views: [], installedApp: null, problem: null }),

  docs_tree: () => docTree,
  doc_read: (a) => ({ content: docs[a.path] ?? "", modified: now - day }),
  search_doc_names: () => Object.keys(docs).map((path) => ({ projectId: "p-checkout", path })),

  notebook_pages: (a) => (a.projectId === "p-checkout" ? Object.values(pages).map(({ content, database, ...m }) => m) : []),
  notebook_page: (a) => pages[a.id],
  notebook_save: (a) => pages[a.id],
  notebook_search: () => [],
  search_everything: () => ({ pages: [], docs: [], truncated: false }),

  git_info: (a) =>
    a.projectId === "p-checkout"
      ? {
          root: "/Users/alex/code/checkout",
          trusted: true,
          status: { branch: "fix/login-redirect", upstream: "origin/fix/login-redirect", ahead: 1, behind: 0, hasCommits: true, operation: null, remotes: ["origin"], files: gitFiles },
        }
      : null,
  git_watch: () => null,
  git_unwatch: () => null,
  git_log: (a) => commits.slice(0, a.limit ?? 50),
  git_commit_files: () => gitFiles.slice(0, 2),
  git_file_versions: (a) =>
    a.path === "src/auth/redirect.ts"
      ? { original: redirectBefore, modified: redirectAfter, binary: false }
      : a.path === "docs/auth.md"
        ? { original: docs["docs/auth.md"].replace("Only **relative paths on our own host** are accepted", "Any path is accepted"), modified: docs["docs/auth.md"], binary: false }
        : { original: "export {};\n", modified: "export {};\n// handles ?next=\n", binary: false },
  git_branches: () => [
    { name: "fix/login-redirect", remote: false, current: true, upstream: "origin/fix/login-redirect", date: iso(now - hour), subject: "WIP" },
    { name: "main", remote: false, current: false, upstream: "origin/main", date: iso(now - 2 * hour), subject: commits[0].subject },
  ],
  git_outgoing: () => commits.slice(0, 1),
  git_identity: () => ({ name: "Alex Morgan", email: "alex@example.com" }),
  git_last_message: () => "",
  terminal_window: () => null,

  extensions_list: () => extensions,
  extensions_root: () => "/Users/alex/.octopus/extensions",
  marketplaces_list: () => marketplaces,
  extension_readme: (a) =>
    ({
      "log-explorer": "# Log explorer\n\nSearch the checkout service's logs by request id, customer or error.\n",
      "feature-flags":
        "# Feature flags\n\nThe team's flags for development, staging and production, side by side.\n\n- Flip a flag and see the diff before saving\n- Who changed what, and when\n- A task for every flag older than 90 days\n",
    })[a.id as string] ?? null,

  "plugin:event|listen": () => Math.floor(Math.random() * 1e6),
  "plugin:event|unlisten": () => null,
  "plugin:event|emit": () => null,
};

const unknown = new Set<string>();
mockWindows("main");
mockIPC((cmd, args) => {
  const h = handlers[cmd];
  if (h) return h(args ?? {});
  if (!unknown.has(cmd)) {
    unknown.add(cmd);
    console.warn("[demo] unanswered command", cmd, args);
  }
  return null;
});

// Remember nothing between runs: every screenshot starts from the same workbench.
localStorage.clear();
// Side-by-side diffs: "auto" picks a layout from the editor's measured width, which headless Chrome may never report.
localStorage.setItem("octopus.git.diffSettings", JSON.stringify({ layout: "split" }));

await import("@octopus/main.tsx");
const scenes = await import("./scenes");
(window as any).demo = scenes;

const scene = new URLSearchParams(location.search).get("scene");
if (scene) void scenes.show(scene);

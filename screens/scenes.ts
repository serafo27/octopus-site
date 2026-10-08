// The workbench set up for each screenshot: shoot.sh opens ?scene=<name>.
import { useStore } from "@octopus/lib/store";
import { spawnQueue } from "./state";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const s = () => useStore.getState();

async function loaded() {
  while (!s().loaded || !s().sessionsReady) await sleep(50);
}

/** Three Claude sessions and a shell in checkout: working, waiting for an answer, done, and a dev server. */
let started = false;
async function sessions() {
  if (started) return;
  started = true;
  const spawn = async (transcript: string, busy: boolean, req: Parameters<ReturnType<typeof s>["startSession"]>[0]) => {
    spawnQueue.push({ transcript, busy });
    return s().startSession({ background: true, ...req });
  };
  await spawn("login", true, { projectId: "p-checkout", taskId: "t-1", title: "Fix the login redirect", kind: "claude" });
  const pay = await spawn("applepay", false, { projectId: "p-checkout", taskId: "t-2", title: "Add Apple Pay to the payment step", kind: "claude" });
  await spawn("cart", false, { projectId: "p-checkout", taskId: "t-3", title: "Refactor cart totals into one module", kind: "claude" });
  await spawn("shell", false, { projectId: "p-checkout", title: "npm run dev", kind: "shell" });
  // Waiting for the user: it rang the bell while not on screen.
  if (pay) useStore.setState((st) => ({ sessions: st.sessions.map((x) => (x.id === pay ? { ...x, attention: true } : x)) }));
}

const project = "p-checkout";

/** Clicks the innermost visible element showing this text, a count after it aside (a tab, a file, a row). */
async function click(text: string) {
  for (let i = 0; i < 40; i++) {
    const el = [...document.querySelectorAll<HTMLElement>("body *")]
      .reverse()
      .find((e) => (e.textContent ?? "").replace(/\s*\d+$/, "").trim().toLowerCase() === text.toLowerCase() && e.offsetParent);
    if (el) {
      el.click();
      return;
    }
    await sleep(100);
  }
  console.warn("[demo] nothing to click:", text);
}
const sessionByTask = (taskId: string) => s().sessions.find((x) => x.taskId === taskId)?.id;

const scenes: Record<string, () => Promise<void> | void> = {
  async board() {
    s().openEditor("board", project);
  },
  async task() {
    s().openEditor("board", project);
    s().selectTask("t-1");
  },
  async terminals() {
    const id = sessionByTask("t-1");
    if (id) s().focusSession(id);
  },
  async docs() {
    s().openDoc(project, "docs/auth.md");
  },
  async git() {
    s().openEditor("git", project);
    await sleep(800);
    await click("redirect.ts");
  },
  async notebook() {
    s().openPage(project, "pg-spec");
  },
  async database() {
    s().openPage(project, "pg-db");
  },
  async sessions() {
    s().toggleSection("sessions");
  },
  async extensions() {
    s().toggleSection("extensions");
    await sleep(500);
    await click("Browse");
    await sleep(300);
    await click("Feature flags");
  },
  async otherapps() {
    useStore.setState({ sessionsLayout: "list", otherAppsOpen: true });
    s().toggleSection("sessions");
  },
  async priorities() {
    s().openAllTasks("priorities");
  },
};

export async function show(name: string) {
  await loaded();
  await sessions();
  await scenes[name]();
  await sleep(1500);
  // Mido isn't part of the demo: its "unavailable" warning would only distract.
  for (const el of document.querySelectorAll<HTMLElement>("button, span")) {
    if (el.textContent?.trim() === "Mido unavailable") el.style.display = "none";
  }
  document.body.dataset.ready = name;
}

export const names = Object.keys(scenes);

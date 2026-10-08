// Octopus site: the hero's animation and the download links, read from this repository's GitHub Releases.
(() => {
  const config = window.OCTOPUS_SITE ?? { repo: "serafo27/octopus-site" };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------------------------------------
  // Hero: one task goes from To do to Review while its Claude session works on it.

  const board = $("[data-board]");
  const task = $("[data-task]");
  const startButton = $("[data-start]");
  const term = $("[data-term]");
  const dots = $$("[data-session-dot]");
  const status = $("[data-status]");

  const TRANSCRIPT = [
    ["u", "> Fix the login redirect"],
    ["t", "  After sign-in, users land on / instead of the page they came from."],
    ["t", "  Read docs/auth.md. When you're done, run: npm test -- auth"],
    ["", ""],
    ["", "⏺ Read docs/auth.md, src/auth/redirect.ts"],
    ["", "⏺ Update src/auth/redirect.ts"],
    ["ok", "    + const next = safeNext(params.get(\"next\"))"],
    ["ok", "    + return redirect(next ?? \"/\")"],
    ["", "⏺ Bash npm test -- auth"],
    ["ok", "    ✓ 14 passed"],
    ["", ""],
    ["", "The redirect now keeps the page you came from."],
    ["", "Task moved to Review."],
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let running = false;
  let visible = true;
  let generation = 0;

  function setDots(state) {
    for (const d of dots) {
      d.className = "dot";
      if (state === "off") d.classList.add("off");
      if (state === "working") d.classList.add("pulse");
      if (state === "idle") d.classList.add("idle");
    }
  }

  function updateCounts() {
    for (const col of $$("[data-col]", board)) {
      $("[data-count]", col).textContent = $$(".card", col).length;
    }
  }

  // Move the card to another column, sliding it from where it was (FLIP).
  function moveTask(colName, animate = true) {
    const target = $(`[data-col="${colName}"]`, board);
    const before = task.getBoundingClientRect();
    const head = $(".col-head", target);
    head.after(task);
    updateCounts();
    if (!animate || reduced) return;
    const after = task.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    task.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
      { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }

  function renderTranscript(lines, caret) {
    term.innerHTML = "";
    for (const [cls, text] of lines) {
      const line = document.createElement("span");
      if (cls) line.className = cls;
      line.textContent = text + "\n";
      term.append(line);
    }
    if (caret) {
      const c = document.createElement("span");
      c.className = "caret";
      term.append(c);
    }
  }

  function reset() {
    moveTask("todo", false);
    task.classList.remove("lit");
    startButton.classList.remove("pressed");
    startButton.hidden = false;
    setDots("off");
    renderTranscript([["t", "Start Claude on a task to open a session here."]], false);
    if (status) status.textContent = "1 working, 1 waiting";
  }

  function finalState() {
    moveTask("review", false);
    startButton.hidden = true;
    setDots("idle");
    renderTranscript(TRANSCRIPT, false);
    if (status) status.textContent = "1 waiting, 1 for review";
  }

  async function waitVisible(gen) {
    while (!visible && gen === generation) await sleep(300);
    return gen === generation;
  }

  async function play() {
    if (running) return;
    running = true;
    const gen = ++generation;
    try {
      for (;;) {
        reset();
        await sleep(1600);
        if (!(await waitVisible(gen))) return;

        task.classList.add("lit");
        startButton.classList.add("pressed");
        await sleep(450);
        startButton.hidden = true;
        moveTask("doing");
        setDots("working");
        if (status) status.textContent = "2 working, 1 waiting";

        const shown = [];
        for (const line of TRANSCRIPT) {
          if (!(await waitVisible(gen))) return;
          shown.push(line);
          renderTranscript(shown, true);
          await sleep(line[1] ? 420 : 160);
        }
        await sleep(500);
        task.classList.remove("lit");
        moveTask("review");
        setDots("idle");
        renderTranscript(TRANSCRIPT, false);
        if (status) status.textContent = "1 working, 1 waiting, 1 for review";
        await sleep(5200);
      }
    } finally {
      running = false;
    }
  }

  if (board && task && term) {
    if (reduced) {
      finalState();
    } else {
      reset();
      const figure = board.closest("figure");
      new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting) && !document.hidden;
        if (visible) play();
      }, { threshold: 0.25 }).observe(figure);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) visible = false;
      });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Downloads: the latest release's .dmg, and the ones before it.

  const releasesUrl = `https://github.com/${config.repo}/releases`;
  for (const a of $$("[data-repo-link]")) a.href = releasesUrl;

  const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" });

  // Prefer the universal build; the release workflow also uploads it as Octopus.dmg.
  function pickDmg(assets) {
    const dmgs = assets.filter((a) => a.name.endsWith(".dmg"));
    return (
      dmgs.find((a) => /universal/i.test(a.name)) ??
      dmgs.find((a) => a.name === "Octopus.dmg") ??
      dmgs[0] ??
      null
    );
  }

  const sizeOf = (bytes) => `${(bytes / 1024 / 1024).toFixed(0)} MB`;

  function showNoRelease() {
    $("[data-release-summary]").innerHTML = "";
    $("[data-release-summary]").append(
      "The first version isn't out yet. ",
      Object.assign(document.createElement("a"), { href: releasesUrl, textContent: "Watch the releases on GitHub" }),
      " to hear when it is.",
    );
    const note = $("[data-download-note]");
    if (note) note.textContent = "Coming soon for Apple Silicon and Intel Macs.";
    for (const label of $$("[data-download-label]")) label.textContent = "Download for Mac";
  }

  function showReleases(releases) {
    const usable = releases.filter((r) => !r.draft && !r.prerelease && pickDmg(r.assets));
    if (!usable.length) return showNoRelease();

    const latest = usable[0];
    const dmg = pickDmg(latest.assets);
    const version = latest.tag_name.replace(/^v/, "");
    const date = dateFormat.format(new Date(latest.published_at));

    for (const a of $$("[data-download-link]")) {
      a.href = dmg.browser_download_url;
      a.hidden = false;
    }
    for (const label of $$("[data-download-label]")) label.textContent = `Download Octopus ${version}`;
    const note = $("[data-download-note]");
    if (note) note.textContent = `Released ${date}. For Apple Silicon and Intel Macs. Needs Claude Code.`;

    $("[data-release-summary]").textContent =
      `Version ${version}, released ${date}. One download runs natively on Apple Silicon and Intel Macs.`;
    const alt = $("[data-download-alt]");
    alt.innerHTML = "";
    alt.append(
      `${dmg.name}, ${sizeOf(dmg.size)}. `,
      Object.assign(document.createElement("a"), { href: latest.html_url, textContent: "What's new in this version" }),
    );

    const list = $("[data-releases]");
    list.innerHTML = "";
    const older = usable.slice(1, 8);
    if (!older.length) {
      list.append(Object.assign(document.createElement("li"), { className: "small", textContent: "This is the first version." }));
      return;
    }
    for (const r of older) {
      const li = document.createElement("li");
      const file = pickDmg(r.assets);
      li.append(
        Object.assign(document.createElement("b"), { textContent: r.tag_name.replace(/^v/, "") }),
        Object.assign(document.createElement("span"), { className: "small grow", textContent: dateFormat.format(new Date(r.published_at)) }),
        Object.assign(document.createElement("a"), { href: r.html_url, textContent: "Notes" }),
        Object.assign(document.createElement("a"), { href: file.browser_download_url, textContent: `Download ${file.name}` }),
      );
      list.append(li);
    }
  }

  async function loadReleases() {
    try {
      const res = await fetch(`https://api.github.com/repos/${config.repo}/releases?per_page=20`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
      showReleases(await res.json());
    } catch {
      // Rate limited or offline: the latest release's fixed download URL still works.
      for (const a of $$("[data-download-link]")) {
        a.href = `${releasesUrl}/latest/download/Octopus.dmg`;
        a.hidden = false;
      }
      $("[data-release-summary]").innerHTML = "";
      $("[data-release-summary]").append(
        "Couldn't read the version list from GitHub. The button downloads the latest version; ",
        Object.assign(document.createElement("a"), { href: releasesUrl, textContent: "every version is on GitHub" }),
        ".",
      );
    }
  }

  loadReleases();
})();

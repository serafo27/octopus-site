// Octopus site: screenshots that open larger, and the download links, read from this repository's GitHub Releases.
(() => {
  const config = window.OCTOPUS_SITE ?? { repo: "serafo27/octopus-site" };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ---------------------------------------------------------------------------------------------
  // Screenshots open larger on click.

  const lightbox = $("[data-lightbox]");
  if (lightbox && typeof lightbox.showModal === "function") {
    const big = $("img", lightbox);
    for (const shot of $$(".shot img")) {
      shot.addEventListener("click", () => {
        big.src = shot.currentSrc || shot.src;
        big.alt = shot.alt;
        lightbox.showModal();
      });
    }
    lightbox.addEventListener("click", () => lightbox.close());
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
    if (note) note.textContent = `Version ${version}, ${date}. For Apple Silicon and Intel Macs.`;

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
    if (!older.length) return;
    $("[data-releases-wrap]").hidden = false;
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

# Octopus: site and releases

This repository has two jobs:

1. **The presentation site** for Octopus, the Mac app, in [`docs/`](docs/), served with GitHub Pages.
2. **The downloads**: each version of the app is built from a tag of
   [`serafo27/octopus`](https://github.com/serafo27/octopus) and published under this repository's
   [Releases](../../releases). The site's download button reads them from the GitHub API.

The app's source lives in `serafo27/octopus`. This repository only holds the site and the release pipeline.

## The site

Plain HTML, CSS and JavaScript, no build step:

- `docs/index.html`: the page, with one section per feature, each with a screenshot of the app.
- `docs/styles.css`: colours from the app icon, dark like the screenshots.
- `docs/app.js`: screenshots that open larger, and the download links (latest `.dmg`, older versions).
- `docs/site-config.js`: the repository the releases are read from.
- `docs/assets/screens/*.webp`: the screenshots, made by `screens/` (below).

To preview it: `python3 -m http.server -d docs 8000`, then open http://localhost:8000.

`.github/workflows/deploy-pages.yml` publishes `docs/` on every push to `main` that changes it.
The first time: **Settings › Pages › Build and deployment › Source: GitHub Actions**.

## Screenshots

The screenshots are Octopus's **real UI**, not mock-ups: `screens/` serves the app's frontend from
`../octopus/src` with Vite and answers every Tauri command from a made-up workspace (`screens/demo.ts`:
projects, tasks, Claude sessions, git changes, docs, notebooks, extensions). Each scene in
`screens/scenes.ts` sets the workbench up, and headless Chrome takes the picture.

```bash
sh screens/shoot.sh              # every scene → screens/out/*.png and docs/assets/screens/*.webp
sh screens/shoot.sh git docs     # only some
```

Needs `../octopus` (or `OCTOPUS_DIR`) with its `node_modules`, Google Chrome and `cwebp`
(`brew install webp`). Run it again when the UI changes. Nothing of yours is shown: the demo data is
all invented, and the app's own storage isn't touched.

## Releasing a version

```text
serafo27/octopus                         serafo27/octopus-site
────────────────                         ─────────────────────
git tag v0.2.0 && git push --tags
  └─ notify-release.yml ──dispatch──▶   release.yml (macos-latest)
                                          checkout octopus @ v0.2.0
                                          check tauri.conf.json version == 0.2.0
                                          tauri build --target universal-apple-darwin
                                          GitHub Release v0.2.0:
                                            Octopus_0.2.0_universal.dmg
                                            Octopus.dmg  (fixed name, for /releases/latest/download/Octopus.dmg)
                                            Octopus_0.2.0_universal.app.zip
                                            SHA256SUMS.txt
```

1. In `octopus`, bump `version` in `src-tauri/tauri.conf.json` (and `package.json`, `Cargo.toml`), commit.
2. `git tag v0.2.0 && git push origin v0.2.0`.
3. The release appears here in about 15 to 20 minutes, and the site offers it.

You can also start a build by hand: **Actions › Release Octopus › Run workflow**, with the tag.
Running it again for the same tag replaces the files of that release.
Tags with a suffix (`v0.3.0-beta.1`) become pre-releases, which the site doesn't offer.

### One-time setup

| Where | Secret | What |
| --- | --- | --- |
| `octopus` | `SITE_DISPATCH_TOKEN` | Fine-grained token, repository `octopus-site`, **Contents: read and write**. Lets the tag start the build here. |
| `octopus-site` | `OCTOPUS_REPO_TOKEN` | Fine-grained token, repository `octopus`, **Contents: read**. Only needed while `octopus` is private. |

### Signing and notarization (optional)

Without these secrets the app is signed ad hoc: it runs, but the first time macOS asks the user to
allow it (the site and the release notes explain how). With an Apple Developer account, add to
`octopus-site`:

| Secret | What |
| --- | --- |
| `APPLE_CERTIFICATE` | `base64 -i DeveloperID.p12` of the *Developer ID Application* certificate |
| `APPLE_CERTIFICATE_PASSWORD` | the `.p12`'s password |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Name (TEAMID)` |
| `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | notarization; `APPLE_PASSWORD` is an app-specific password |

The workflow uses them as soon as they're there.

## Not done yet

- **Auto-update**: Octopus doesn't use `tauri-plugin-updater` yet. When it does, the workflow can sign
  the update and attach a `latest.json` to each release.
- **Official extensions marketplace**: a repository with `octopus-marketplace.json` the site can link to and list.

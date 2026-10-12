# YAML Flat-File Storage & GitHub Pages Static Hosting Architecture

Enable Bay Area Darts to run as a high-performance web application on GitHub Pages with zero blank-page errors, backed by human-readable separate YAML flat data files (`courses.yaml`, `members.yaml`, `teams.yaml`, `rounds.yaml`), 1-click YAML export and import tools to sync changes directly into your Git backup, and automated GitHub Actions deployment.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed with the user and shape this revised implementation plan:

- **Confirmed Decision 1 (Separate YAML Flat Files)**: The primary data records will be structured as individual human-readable YAML files in a `data/` directory:
  - `data/courses.yaml`: Course specs, tee boxes, yardages, hole pars, and handicap indexes.
  - `data/members.yaml`: Golfer profiles, handicaps, differentials, and scoring averages.
  - `data/teams.yaml`: Pre-configured scramble squads (1P, 2P, 3P, 4P) and rosters.
  - `data/rounds.yaml`: Completed historical scorecards, gross/net scores, and hole details.
  - `data/future-rounds.yaml`: Upcoming muni placeholders, confirmed dates, and RSVPs.
- **Confirmed Decision 2 (Export & Import YAML for Git Backups)**: Because GitHub Pages is a static host without write permissions to the repository's git commit tree, the application will provide a dedicated **Clubhouse YAML Manager**:
  - **1-Click YAML Export**: Golfers can download updated `members.yaml`, `rounds.yaml`, or all data files in one click after logging rounds to easily commit them to their Git repository.
  - **Drag-and-Drop YAML Import**: Golfers can upload any updated YAML file to immediately hydrate or sync the browser state.
- **Confirmed Decision 3 (Dual-Mode Local Disk Sync in Dev)**: When running locally or in AI Studio, `server.ts` will directly read and write to the `data/*.yaml` files on disk, ensuring changes made in development are saved straight to the YAML files.
- **Confirmed Decision 4 (Relative Asset Paths for GitHub Pages)**: Set Vite `base: './'` so all compiled JavaScript, CSS, fonts, and images resolve accurately whether hosted on GitHub Pages (`https://<user>.github.io/<repo>/`), at a custom domain, or locally.
- **Confirmed Decision 5 (Automated GitHub Actions Deployment)**: Provide a `.github/workflows/deploy.yml` workflow that automatically tests, builds, and deploys the site to GitHub Pages on every push to `main`.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Solves the Blank White Page**: Fixes the 3 root causes of GitHub Pages loading errors: relative asset path resolution (`base: './'`), automated production compilation (`dist/`), and client-side independence from the local Express server.
  2. **Human-Readable YAML Storage**: Moves away from opaque binary or database stores to clean, git-diffable YAML files that you can view, edit, and back up directly in GitHub.
  3. **Git-Synced Clubhouse Workflow**: Users can score rounds or manage scramble squads on GitHub Pages, export the updated YAML files, and push them to GitHub to keep their repository fully up to date.
- **Target Audience / Persona**: Bay Area Darts golfers backing up their club records on GitHub and using GitHub Pages for mobile live scoring and clubhouse tracking.
- **Key Value**: 100% free hosting, version-controlled club records in clean YAML, and a responsive web app that never shows a blank page.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GITHUB PAGES & YAML WORKFLOW                    │
│                                                                        │
│   1. USER VISITS GITHUB PAGES                                          │
│      • Browser downloads compiled SPA bundle via relative paths        │
│      • App parses bundled data/*.yaml files (courses, members, squads) │
│      • Instant dashboard load with zero network errors                 │
│                                                                        │
│   2. USER PLAYS & LOGS ROUNDS                                          │
│      • Scores hole-by-hole, records putts, FIR/GIR, scramble honors    │
│      • Round stats immediately update in browser state & localStorage  │
│                                                                        │
│   3. USER BACKS UP TO GITHUB (EXPORT YAML)                             │
│      • Opens Clubhouse Roster & Teams ──► "YAML Backup & Git Sync"     │
│      • Clicks "Export Updated YAML Files" (or single rounds.yaml)      │
│      • Drops files into repository folder & commits to GitHub:         │
│          git commit -am "Log Harding Park round" && git push           │
│      • GitHub Actions builds & redeploys latest records automatically  │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual & Interactive Preservation
- **Preserve Existing UI**: The dark/emerald clubhouse design, comic-style badges, live scorecards, and scramble squad builders remain untouched.
- **Clubhouse YAML Management Modal / Tab**: Integrated into `ClubhouseHubModal`:
  - Clean card displaying flat-file status: `courses.yaml`, `members.yaml`, `teams.yaml`, `rounds.yaml`.
  - Buttons: `Download All YAML`, `Export rounds.yaml`, `Import / Restore YAML`.
  - Copyable Git command helper: `git commit -am "Update club records" && git push`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Separate YAML Files vs. Monolithic File**
  - *Chosen Approach*: Separate YAML files (`courses.yaml`, `members.yaml`, `teams.yaml`, `rounds.yaml`, `future-rounds.yaml`).
  - *Why*: Much cleaner Git diffs. Modifying member handicaps doesn't dirty the course list; logging a round only changes `rounds.yaml` and `members.yaml`.
  - *Alternatives Considered*: Single `clubhouse.yaml` (confirmed rejected by user preference).
- **Decision 2: Client-Side YAML Parser (`js-yaml`) vs. Pre-compiling to JSON**
  - *Chosen Approach*: Use `js-yaml` in both Vite frontend and Express server, bundling raw YAML files via Vite.
  - *Why*: Allows true dynamic import and export of `.yaml` files in the browser without requiring a Node build step for exports.
  - *Alternatives Considered*: JSON only (confirmed preference for YAML).
- **Decision 3: Export/Import vs. GitHub Personal Access Token (PAT)**
  - *Chosen Approach*: 1-click YAML file export and drag-and-drop import.
  - *Why*: Safe and frictionless. Asking golfers to generate GitHub Personal Access Tokens and store them in browser storage creates security risks and setup friction.
  - *Alternatives Considered*: In-browser GitHub API commit tool via PAT.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (VITE / REACT)                   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      src/App.tsx                               │   │
│   │  • Clubhouse views, live scoring, modals                       │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 src/services/yamlStorage.ts                    │   │
│   │  • Parses & formats YAML using js-yaml                         │   │
│   │  • Loads initial data from data/*.yaml                         │   │
│   │  • In-memory cache + localStorage fallback                     │   │
│   │  • Export functions: exportYamlFile(), exportAllZip()          │   │
│   │  • Import function: importYamlFile()                           │   │
│   └───────────────────────┬────────────────────────┬───────────────┘   │
│                           │                        │                   │
│         (Local Node.js)   ▼                        ▼  (GitHub Pages)   │
│   ┌───────────────────────────────┐        ┌───────────────────────┐   │
│   │          server.ts            │        │   Browser Memory /    │   │
│   │   Reads/Writes data/*.yaml    │        │      localStorage     │   │
│   │       directly to disk        │        │   + 1-Click Export    │   │
│   └───────────────────────────────┘        └───────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         FLAT DATA REPOSITORY FILES                     │
│                                                                        │
│   • data/courses.yaml       (Pars, yardages, slopes, tees)             │
│   • data/members.yaml       (Profiles, WHS indexes, scoring averages)  │
│   • data/teams.yaml         (1P, 2P, 3P, 4P Scramble squads & rosters) │
│   • data/rounds.yaml        (Completed hole-by-hole scorecards)        │
│   • data/future-rounds.yaml (Upcoming dates, RSVPs, reminders)         │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & Build Strategy Details

1. **Flat YAML Data Directory (`data/`)**:
   - `data/courses.yaml`: Converted from `src/data/courses.ts` into clean, human-readable YAML.
   - `data/members.yaml`: Converted from `src/data/members.ts`.
   - `data/teams.yaml`: Converted from `INITIAL_SCRAMBLE_TEAMS`.
   - `data/rounds.yaml`: Converted from initial completed rounds.
   - `data/future-rounds.yaml`: Converted from `INITIAL_FUTURE_ROUNDS`.

2. **YAML Parser & Storage Service (`src/services/yamlStorage.ts`)**:
   - Uses `js-yaml` to serialize and deserialize data models.
   - Dual-mode sync:
     - On GitHub Pages: Reads bundled YAML, saves user edits to browser storage, provides `exportYaml(type)` download triggers.
     - In Node dev (`server.ts`): Reads and writes directly to `data/*.yaml` using `fs.promises`.

3. **Clubhouse YAML Management Modal (`src/components/YamlBackupModal.tsx`)**:
   - Integrated into `ClubhouseHubModal` and dashboard.
   - Shows file statuses with last-modified timestamps and item counts.
   - 1-click download buttons:
     - `Download All YAML Files (.zip or multi-file)`
     - `Download rounds.yaml`
     - `Download members.yaml`
     - `Download teams.yaml`
   - Drag & drop dropzone to load external YAML files into the app.

4. **Vite Configuration (`vite.config.ts`)**:
   - `base: './'` for relative asset links.
   - Configure raw loader / asset handling for `.yaml` files.

5. **GitHub Actions Workflow (`.github/workflows/deploy.yml`)**:
   - Automatically builds on push to `main` branch.
   - Deploys `dist/` directly to GitHub Pages using official GitHub Actions (`actions/deploy-pages@v4`).

6. **GitHub Pages SPA Fallback (`public/404.html`)**:
   - Prevents 404 errors on deep links and browser reloads on GitHub Pages.

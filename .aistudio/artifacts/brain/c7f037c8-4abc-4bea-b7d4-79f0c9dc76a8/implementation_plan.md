# Unified Clubhouse Management Hub & Mobile View Optimization

Streamline the Bay Area Darts clubhouse experience by consolidating Golfer Profiles and Scramble Teams into a single unified management hub, bringing "Join with PIN" directly into the Start Round flow, and overhauling mobile responsiveness with full-viewport modal sheets and zero element collisions.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification and anchor this implementation:

- **Confirmed Decision 1 (Unified Hub Presentation)**: Provide a dedicated tabbed modal ("Clubhouse Roster & Teams") that seamlessly toggles between **Golfer Profiles** (viewing stats, switching active user, editing profile/email, adding new golfers) and **Scramble Teams** (creating, editing, and managing 2-to-4 player squads). This reduces home page tile clutter.
- **Confirmed Decision 2 (Start Round PIN Integration)**: Embed "Join with PIN" as a primary tab inside `NewRoundModal` alongside "Start Live Round" and "Log Past Round". Golfers can launch a live room, join a friend's room via PIN, or log a past scorecard all from one dialog.
- **Confirmed Decision 3 (Mobile Dialog Architecture)**: Convert all modals on mobile (`< 640px`) to native-feeling full-screen viewport sheets (`h-[100dvh]` with `sticky` headers and `sticky` action footers). This prevents pop-ups from being cut off or overflowing small screens.
- **Confirmed Decision 4 (Header & Tile Overlap Fixes)**: Restructure the top navigation header and dashboard quick-launch tiles with responsive breakpoints, flex truncation, and min-touch targets (≥ 44px) so elements never collide or clip on narrow devices.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Consolidated Clubhouse Roster Hub**: Replaces multiple disconnected home tiles with a unified "Clubhouse Roster & Teams" modal featuring two intuitive tabs: *Golfer Profiles & Handicaps* and *Scramble Squads (2–4 Players)*.
  2. **All-in-One Round Launcher**: Expands the Start Round modal into a 3-tab unified hub:
     - *Start Live Round*: Host a live multi-device foursome or 2v2 duel with auto-generated PIN.
     - *Join with PIN*: Enter a 4-digit code to immediately connect to a friend's live room.
     - *Log Past Round*: Historical date picker with hole-by-hole or quick total entry.
  3. **Mobile-First Responsive Layout**: Solves mobile clipping, modal cut-offs, and element collisions by implementing fluid 100dvh sheets with pinned thumb-friendly save/close footers, adaptive font scaling, and collision-proof header spacing.
- **Target Audience / Persona**: Bay Area Darts golfers checking in from mobile phones at tee boxes, in golf carts, or in the clubhouse after 18 holes.
- **Key Value**: A significantly cleaner home page with fewer redundant tiles, frictionless round joining, and an effortless mobile experience with zero overlapping buttons or overflowing dialogs.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HOME DASHBOARD (STREAMLINED)                     │
│                                                                        │
│  [ Start / Enter Round ]    [ Clubhouse Roster & Teams ]   [ Future Rds ]│
│   (Live, PIN, or Past)       (Golfers & Scramble Teams)     (Muni Alerts)│
└──────────────────┬─────────────────────────────┬───────────────────────┘
                   │                             │
                   ▼                             ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────┐
│       START / ENTER ROUND MODAL      │  │    CLUBHOUSE MANAGEMENT HUB   │
│ ┌──────────────┬──────────┬────────┐ │  │ ┌──────────────┬────────────┐ │
│ │ Start Live   │ Join PIN │ Past Rd│ │  │ │ Golfer Roster│ Scramble   │ │
│ └──────────────┴──────────┴────────┘ │  │ │ & Profiles   │ Teams (2-4)│ │
│                                      │  │ └──────────────┴────────────┘ │
│ • Live Foursome / 2v2 Match Play     │  │ • Active golfer profile card  │
│ • Instant PIN join & player claim    │  │ • Edit email, phone, nickname │
│ • Date picker & Hole/Total scores    │  │ • Build duos, trios, 4-man    │
│                                      │  │ • Team handicap preview       │
│ [Sticky Footer: Submit / Close]      │  │ [Sticky Footer: Save / Close] │
└──────────────────────────────────────┘  └───────────────────────────────┘
```

### Mobile Layout & Anti-Overlap Polish
- **Full-Screen Mobile Viewport Sheets**:
  - On viewports `< 640px` (`sm:` breakpoint), modals occupy `100dvh` with `rounded-none`, zero exterior margin, and zero background gutter.
  - Modal headers are pinned (`sticky top-0 z-20`) with prominent close buttons.
  - Form and scorecard bodies scroll smoothly (`flex-1 overflow-y-auto overscroll-contain`).
  - Action buttons are pinned in a sticky bottom tray (`sticky bottom-0 z-20`) with safe-area padding for mobile thumbs.
- **Header Responsive Densification**:
  - On mobile, condense the brand mark to avoid taking up the entire line (`BAY AREA DARTS`).
  - Keep the theme toggle, active golfer avatar badge, and the primary "New Round" trigger button; demote redundant duplicate buttons that already exist in the launcher.
  - Zero line-wrapping or button collisions in the top bar.
- **Home Launch Tile Modernization**:
  - Consolidate the 6 micro-tiles into 3 or 4 high-contrast, comfortable touch targets (`min-h-[72px]`, `≥ 44px` touch targets):
    1. **Start / Enter Round** (Emerald, primary hero action)
    2. **Clubhouse Roster & Teams** (Blue/Purple, unified player & team management)
    3. **Plan Future Round** (Amber, upcoming muni tee time notifications)
    4. **Scan Scorecard** (Slate/Camera, OCR digitizer)

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Consolidated Management Hub vs. Multiple Separate Pop-ups**
  - *Chosen Approach*: Create a unified `ClubhouseHubModal` (or unified Roster & Teams manager) that houses both Golfer Profiles and Scramble Squads in a clean segmented tab control.
  - *Why*: Eliminates competing tiles on the dashboard, keeps player handicaps and team rosters logically co-located, and makes switching active profiles or managing teams a single-click action.
  - *Alternatives Considered*: Leaving separate buttons on the home screen was explicitly noted by the user as causing too many tiles.

- **Decision 2: 3-Way Segmented Start Round Modal**
  - *Chosen Approach*: Integrate "Join with PIN" as a first-class tab in `NewRoundModal` (`[Start Live Round | Join with PIN | Log Past Round]`).
  - *Why*: Gives players one definitive "Play Golf" entry point. Whether you are hosting a new group, connecting to a friend's room with a PIN, or logging yesterday's scorecard, you open the same modal.
  - *Alternatives Considered*: Keeping Join with PIN as a separate floating card, which clutters the home page and duplicates modal boilerplate.

- **Decision 3: Responsive Modal Strategy (Sheet vs. Fixed Dialog)**
  - *Chosen Approach*: Adaptive modal container: `fixed inset-0 sm:p-4`, inner card `w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl flex flex-col`.
  - *Why*: Fixed 80vh modals fail on mobile because virtual keyboards, browser navigation bars, and large tables (like hole-by-hole scorecards) cause vertical overflow or clipped buttons. A flex-column sheet guarantees the submit button is always accessible.
  - *Alternatives Considered*: Responsive bottom sheet with drag-to-dismiss, which often conflicts with vertical scrolling on 18-hole scorecards.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (VITE/REACT)                     │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                         Header.tsx                             │   │
│   │  • Collapsible mobile layout with zero button collisions       │   │
│   │  • Logo emblem + Active Golfer avatar + "Start Round"          │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────┴────────────────────────────────┐   │
│   │                    ClubhouseDashboard.tsx                      │   │
│   │  • Streamlined Action Grid (3-4 high-impact hero cards)        │   │
│   │  • Responsive Accolades & Member Roster (no text collisions)   │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│         ┌─────────────────────────┴──────────────────────────┐         │
│         ▼                                                    ▼         │
│   ┌──────────────────────────────┐     ┌─────────────────────────────┐ │
│   │      NewRoundModal.tsx       │     │    ClubhouseHubModal.tsx    │ │
│   │  • Tab 1: Start Live Round   │     │  • Tab 1: Golfer Profiles   │ │
│   │  • Tab 2: Join with PIN      │     │    - Active user overview   │ │
│   │  • Tab 3: Log Past Round     │     │    - Profile/email edit     │ │
│   │  • Full-screen mobile sheet  │     │    - Add new golfer         │ │
│   │  • Sticky footer CTA bar     │     │  • Tab 2: Scramble Teams    │ │
│   └──────────────────────────────┘     │    - 2 to 4 player squads   │ │
│                                        │    - Team stats & handicaps │ │
│                                        │  • Sticky footer controls   │ │
│                                        └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             BACKEND (EXPRESS)                          │
│                                                                        │
│   • GET/POST /api/rounds/rooms (Join & Host PIN sessions)              │
│   • GET/POST/PUT /api/members (Golfer profile data & stats)            │
│   • GET/POST/PUT/DELETE /api/teams (Scramble squad rosters & stats)    │
│   • POST /api/rounds/manual (Historical rounds by date)                │
└────────────────────────────────────────────────────────────────────────┘
```

### Component State & Transition Details
1. **`ClubhouseHubModal.tsx`**:
   - Manages tab state (`'golfers' | 'teams'`).
   - Golfer section integrates personal score history view, WHS index breakdown, profile editing (name, nickname, email, handicap goal), and new golfer creation.
   - Teams section provides duo/trio/foursome builder with live handicap calculation, color tagging, and direct launch into round setup.
2. **`NewRoundModal.tsx`**:
   - Manages 3-state selector (`'live' | 'join' | 'manual'`).
   - In `'join'` mode: Room PIN input field with auto-capitalization, player selection dropdown or guest name, and immediate session connection via `onJoinRoom`.
   - In `'manual'` mode: Historical date picker, course selection, hole-by-hole or quick total input with sticky submit button.
3. **Responsive Styles Across Modals**:
   - Universal full-screen wrapper: `w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl flex flex-col`.
   - Guaranteed sticky footers: `sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shrink-0`.
   - Header truncation: `truncate max-w-[200px]` with clear close `X` target.

# Implementation Plan: Authentication Access Walls, Public "Roster & Teams" Directory & Future Round Edit Restoration

Put key interactive club features behind an authentication access wall while maintaining clean visual tiles for visitors, restore the missing **Edit** button for logged-in users on future round cards, and upgrade the top header button into a unified, read-only "Roster & Teams" directory modal with three tabs (Registered Players, Squads, and Guest Members).

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of Confirmed Decisions & User Feedback:**
> 1. **Edit Button Restoration on Future Rounds**: The edit button will be restored for all authenticated users between the trash icon (left) and the "Tee Off" button (right). The prop interface will be made mandatory across `ClubhouseDashboard` and `FutureRoundsSection` so it cannot be inadvertently omitted or suppressed.
> 2. **Tile Action Access Gate**: Dashboard tiles (Start Live Round, Log Past Round, Scan Scorecard, New Placeholder) will remain visible to logged-out visitors to maintain the UI design, but clicking any member-only tile immediately triggers the Sign-In modal (`onOpenLogin`).
> 3. **Future Round Card Gating**: For unauthenticated visitors, the 7-day notification reminder countdown box (with `.ics`, SMS copy, bell, and email alert), empty `+ Claim Spot` dashed slots, and `Tee Off` button are completely hidden. Cards display only occupied player slots as a clean public schedule.
> 4. **Header Navigation & 3-Tab Directory**: The header button is renamed to **"Roster & Teams"** and opens a public read-only directory with three tabs: **Registered Players** (`!isGuest`), **Squads** (scramble teams), and **Guest Members** (`isGuest`). Clicking a player opens their stats/round history; clicking a squad opens their team history.

---

## 1. Overview & Core Concept

- **What It Does**: 
  - Restores full editing capabilities (`date`, `course`, `teeTimeWindow`, `format`, `teeBox`) for authenticated members on future round cards.
  - Implements a seamless access wall: unauthenticated visitors can browse the clubhouse schedule, recent scores, rankings, courses, and the public roster/squads directory, but cannot trigger member actions (claiming spots, setting email alerts, starting live rounds, scanning scorecards) without signing in.
  - Consolidates player and team browsing into a clean 3-tab modal accessible from anywhere in the application.
- **Target Audience / Persona**:
  - **Club Members**: Log in to manage placeholders, edit round parameters, claim spots, log past rounds, and tee off.
  - **Club Visitors & Recruits**: Browse club activity, course schedules, player rosters, and team scramble halls of fame, with intuitive prompts to sign in or join.
- **Key Value**: Eliminates broken state transitions, ensures data integrity, and provides a professional member-club experience.

---

## 2. User Experience & Visual Design

### A. Future Round Card Layout Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│ 📅 Sun, Nov 1                                           Opens in 3d 21h│
│ Monarch Bay Golf Club — Tony Lema Course                              │
│ 9:00 AM - 9:30 AM · Stroke · White Tees                                │
├────────────────────────────────────────────────────────────────────────┤
│ [LOGGED-IN ONLY] 7-Day Window Reminder Box                             │
│ 🕒 Opens Sun, Oct 25 at 6:00 AM                                        │
│ [✉️ Email Alert]  [📅 Calendar .ics]  [📋 Copy Alert]  [🔔 Web Push]   │
├────────────────────────────────────────────────────────────────────────┤
│ Foursome (3/4)                                          Leave Foursome │
│ [ 🚀 Daniel "Iron Man" ]      [ ⛳ Matthew ]                           │
│ [ ⛳ Michael           ]      [ ➕ Claim Spot ] <-- Hidden if logged out│
├────────────────────────────────────────────────────────────────────────┤
│ Bottom Action Bar:                                                     │
│                                                                        │
│ • Logged-In User View:                                                 │
│   [ 🗑️ Trash ]  [ ✏️ Edit ]  [ ▶️ Tee Off (Start Live Round) ]          │
│   (Delete Left)  (Edit Mid)    (Start Live Round Right)                │
│                                                                        │
│ • Logged-Out Visitor View:                                             │
│   (All bottom action buttons hidden — clean schedule display only)     │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Public Read-Only "Roster & Teams" Modal Design
- **Top Header**: Single text title `"Clubhouse Roster & Teams"` with quiet subtitle *"Directory of official members, scramble squads, and guest players"*.
- **Search Bar**: Minimal search input with magnifying glass icon filtering by name, nickname, or squad handle.
- **Segmented Filter Tabs**:
  1. `Registered Players (N)`: Official club members (`!m.isGuest`), showing avatar, nickname, handicap index (`tabular-nums`), and total rounds logged.
  2. `Squads (N)`: Scramble squads (`teams`), showing team emoji, squad badge, member avatars, and rounds played.
  3. `Guest Members (N)`: Temporary/guest players (`m.isGuest`), with guest badge and rounds count.
- **Interaction**: Clicking any player card invokes `onSelectMemberForHistory(member)`. Clicking any squad card invokes `onSelectTeamForHistory(team)`. No delete, edit, or add controls are rendered.

### C. Dashboard Tile Access Walls
- **Start Live Round** & **Log Past Round**: If logged out, opens `setIsAuthModalOpen(true)` directly.
- **Scan Scorecard**: If logged out, opens `setIsAuthModalOpen(true)` directly.
- **New Placeholder**: If logged out, opens `setIsAuthModalOpen(true)` directly.
- **Team Manager**: If logged out, opens the read-only Roster & Teams modal or prompts login.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Restoring the Edit Button via Strict Prop Typing**
  - *Chosen Approach*: Ensure `onEditFutureRound` is a required prop in `FutureRoundsSectionProps` and `ClubhouseDashboardProps`, and render the Edit button unconditionally whenever `activeUser` is present.
  - *Why*: In `image_d2f3e8c4.png`, the delete button appeared because it only depended on `{confirmDeleteId === fr.id}`, whereas Edit was wrapped in `{onEditFutureRound && ( ... )}` which was either not passed through or swallowed in an intermediate prop branch.
  - *Alternatives Considered*: Leaving the prop optional with a fallback to `onOpenCreateFutureRound()`. Making the prop contract required in TypeScript guarantees compile-time enforcement that it is passed from `App.tsx` through `ClubhouseDashboard` down to `FutureRoundsSection`.

- **Decision 2: Hiding Claim Buttons vs. Showing Login Prompt on Click**
  - *Chosen Approach*: Per user explicit choice in Phase 1, completely hide empty `+ Claim Spot` dashed slots and `+ Sign Me Up` buttons for visitors, rendering only occupied golfer badges.
  - *Why*: Provides an immaculate, uncluttered public schedule for prospective golfers while reserving interactive sign-up for authorized members.

- **Decision 3: Retaining Dashboard Tiles with Sign-In Redirects**
  - *Chosen Approach*: Keep the dashboard action tiles visible to visitors rather than removing them from the grid, but route their click handler to `onOpenLogin()`.
  - *Why*: Preserves the visual balance and discovery of clubhouse features (handicap tracking, AI scorecard scanning, scramble competitions) while preventing unauthorized state mutations.

---

## 4. Technical Architecture & Data Strategy

### System & Event Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                                App.tsx                                 │
│  State: currentUser, activeUser, futureRounds, members, teams          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │       Header.tsx       │       │ ClubhouseDashboard.tsx │
       │ Nav: "Roster & Teams"  │       │ Gated Tiles (onLogin)  │
       └────────────┬───────────┘       └────────────┬───────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │   PlayerListModal.tsx  │       │ FutureRoundsSection.tsx│
       │  3 Tabs:               │       │ - Gated Alert Box      │
       │  1. Registered Players │       │ - Gated Claim Slots    │
       │  2. Squads             │       │ - Gated Tee Off        │
       │  3. Guest Members      │       │ - [Delete] [Edit] [Tee]│
       │ (Read-Only Click-thru) │       │   (when activeUser)    │
       └────────────────────────┘       └────────────────────────┘
```

### Component Updates
1. `src/components/FutureRoundsSection.tsx`:
   - Fix Edit button visibility: render `<button ... onClick={() => onEditFutureRound(fr)}>Edit</button>` between Delete and Tee Off whenever `activeUser` is present.
   - Wrap 7-day reminder countdown box in `{activeUser && ( ... )}`.
   - For foursome slots: if `!activeUser`, do not render empty dashed `+ Claim Spot` slots or `+ Sign Me Up`; display only occupied golfer chips.
   - Wrap `Tee Off (Start Live Round)` button in `{activeUser && ( ... )}`.
   - For section header "+ New Placeholder": if `!activeUser`, call `onOpenProfile ? onOpenProfile() : onOpenCreateFutureRound()`.
2. `src/components/ClubhouseDashboard.tsx`:
   - Ensure `onOpenLogin` or `onOpenProfile` is invoked on click for: Scan Scorecard, Start Live Round, Log Past Round, New Placeholder.
   - Pass `onEditFutureRound` strictly through to `FutureRoundsSection`.
3. `src/components/Header.tsx`:
   - Rename navigation button from "Player List" to "Roster & Teams".
4. `src/components/PlayerListModal.tsx`:
   - Re-title to "Clubhouse Roster & Teams".
   - Accept `teams: TeamGroup[]` prop.
   - Add segmented 3-tab bar: `Registered Players`, `Squads`, `Guest Members`.
   - Wire search filter across all 3 tabs.
   - Wire card clicks to `onSelectMemberForHistory` (players) and `onSelectTeamForHistory` (squads).
   - Ensure no edit/delete buttons exist inside.
5. `src/App.tsx`:
   - Pass `teams` and handlers to `PlayerListModal`.
   - Ensure `futureRoundToEdit` state is cleanly populated on edit and reset on modal close.

---

## 5. Verification Plan

### Automated Build & Syntax Checks
- Run `npm run lint` (`lint_applet`) to ensure TypeScript interface conformity and zero type regressions.
- Run `npm run build` (`compile_applet`) to ensure clean bundle compilation.

### Manual Verification Scenarios
1. **Logged-In User State (Fix Verification)**:
   - Verify future round card shows **Delete** on the left, **Edit** in the middle, and **Tee Off** on the right.
   - Click **Edit**: Verify `CreateFutureRoundModal` opens pre-populated with the round's existing date, course, tee time window (using 30-min interval dropdown), format, and tee box.
   - Submit changes: Verify the round updates immediately on the card.
   - Verify 7-day alert box, `.ics` download, SMS copy, bell, and email alert are fully interactive.
   - Verify `+ Claim Spot` and `Leave Foursome` operate normally.
2. **Logged-Out Visitor State**:
   - Verify future round card shows NO reminder alert box, NO "+ Claim Spot", NO "+ Sign Me Up", NO "Tee Off", and NO Delete/Edit buttons.
   - Click "Scan Scorecard", "Start Live Round", or "New Placeholder" tiles: Verify the Auth/Sign-in modal pops up immediately.
   - Click "Roster & Teams" in the header: Verify 3 tabs appear (Registered Players, Squads, Guest Members) with working search.
   - Click any player or squad: Verify their respective performance history and scorecards open seamlessly.

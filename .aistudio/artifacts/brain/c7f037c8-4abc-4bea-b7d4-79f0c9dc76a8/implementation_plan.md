# Bay Area Darts — Golf Tracking & Live Group Handicap Web App

A high-energy, comic-book styled golf tracker, multiplayer live scoring engine, and handicap system tailored for the **Bay Area Darts** crew. Focuses purely on fast, tactile score tracking across multiple devices via instant room codes, pre-loaded Bay Area course scorecards, alternate tournament formats (Stroke Play, Stableford, Match Play, Scramble, Best Ball), strict data isolation to keep team scores from contaminating individual USGA/WHS handicap stats, and an interactive Gemini-powered photo scorecard digitizer with multi-player row selection and format tagging.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following revisions incorporate your latest specifications for the scorecard photo workflow:

- **Enhanced Scorecard Photo Upload & Player Mapping (Added)**:
  - **Game Format Selector**: Before or during photo upload, the user explicitly chooses the round's format (e.g. Individual Stroke, Stableford, Team Scramble, Best Ball, Match Play).
  - **Multi-Player Row Detection**: When a paper scorecard contains multiple player rows (e.g., a foursome), Gemini detects and displays every individual player row found.
  - **Player Selection & Attribution**: The user can choose exactly which player row(s) to import and map them to specific Bay Area Darts group members (e.g., "Row 1 (DW) -> Dave", "Row 2 (MW) -> Mike"), or select a single player row to import.
  - **Format-Aware Data Routing**: If marked as Scramble or Best Ball, scores are automatically tagged as Team Rounds and routed to team event archives, preventing distortion of individual USGA/WHS handicaps.
- **Pure Score Tracking (No GPS Distance Engine)**: Kept focused exclusively on rapid, glove-friendly score, putt, FIR, and GIR entry.
- **Full Alternate Scoring Modes**: Dynamic calculation of Gross/Net Stroke, Stableford points, Match Play status, and Scramble/Best Ball boards.
- **Multi-Device Live Sync**: Instant room PINs (e.g. `DART-18`) with real-time SSE syncing and offline cache for dead zones.
- **Visual Identity**: Comic book clubhouse style with custom "Bay Area Darts" bullseye flag emblem, halftone textures, and bold ink cards.

---

## 1. Overview & Core Concept

### What It Does
**Bay Area Darts** is a fast, tactile golf scoring and group competition platform. It combines live multi-device scoring for on-course play with an AI-driven paper scorecard digitizer for historical and offline rounds. When scanning a scorecard photo, the app identifies all player rows, lets the user designate the game format (Scramble, Stroke, etc.), and assigns scores to the appropriate crew members with full data isolation between individual WHS handicap rounds and team scramble events.

### Target Audience & Persona
The "Bay Area Darts" golf group: competitive friends playing Bay Area courses who want live foursome scoring, versatile tournament modes, banter-fueled rankings, and an easy way to digitize paper scorecards without messy data contamination.

### Key Value
- **Intelligent Scorecard Photo Ingestion**: Extracts all players from a paper scorecard and lets the user pick which player row to import and who it belongs to.
- **Format Integrity**: Scramble scores never mess up personal handicap differentials; individual stroke rounds maintain strict USGA/WHS compliance.
- **Live Multi-Device Foursome Sync**: Join in seconds via room PIN with no mandatory signup wall.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BAY AREA DARTS FLOW                              │
├─────────────────┬──────────────────┬─────────────────┬──────────────────────┤
│ 1. Home & Club  │ 2. Live Round    │ 3. Score Entry  │ 4. Photo Scorecard   │
│    Dashboard    │    & Game Modes  │    (On Course)  │    Digitizer Modal   │
├─────────────────┼──────────────────┼─────────────────┼──────────────────────┤
│ • Bay Area Darts│ • Course Picker  │ • Large Hole #  │ • Upload Photo       │
│   Bullseye Art  │ • Format Picker: │ • 48px Steppers │ • Choose Format:     │
│ • Active Round  │   - Stroke Play  │   (Strokes/Putts│   Stroke / Scramble  │
│   Room Banner   │   - Stableford   │ • FIR & GIR tap │ • AI Multi-Player Row│
│ • WHS Handicap  │   - Match Play   │ • Real-Time Sync│   Detection & Picker │
│   Leaderboard   │   - Scramble     │ • Offline Auto- │ • Assign to Member   │
│ • "New Round" & │   - Best Ball    │   Save Cache    │ • Review & Save into │
│   "Join Room"   │ • Room Code Gen  │ • Format Matrix │   Appropriate Log    │
└─────────────────┴──────────────────┴─────────────────┴──────────────────────┘
```

### Photo Scorecard Digitizer UX Flow
1. **Upload & Format Selection**: User snaps or uploads a photo of a scorecard and selects the format: **Individual Stroke Play**, **Stableford**, **Scramble**, or **Best Ball**.
2. **AI Row Analysis**: Gemini extracts the course name, date, pars, and all player rows present on the card (e.g. Player A, Player B, Player C, Player D).
3. **Player Row Picker & Member Attribution**:
   - The user sees detected rows with preview scores (Front 9, Back 9, Total).
   - Radio/checkbox allows picking a specific player row to import (or mapping all rows).
   - Dropdown allows selecting which Bay Area Darts member the score belongs to.
4. **Hole-by-Hole Review & Save**: Interactive 18-hole grid highlights pars and strokes for quick visual verification before confirming save into the database.

### Visual Identity & Theme
- **Aesthetic Direction**: **Comic Book / Pop-Art Clubhouse**. Bold ink outlines (`border-2 border-black` / `shadow-[3px_3px_0px_#000]`), retro halftone dots, speech bubbles (`"DART!"`, `"BIRDIE!"`, `"BULLSEYE!"`), and athletic clubhouse badge graphics.
- **Color Palette**:
  - *Dominant Canvas (60%)*: Crisp cream newsprint (`#FBFBF6`) with white panel cards (`#FFFFFF`).
  - *Structural Ink (30%)*: Heavy ink black (`#141413`) and vintage fairway green (`#1E5631`).
  - *Dartboard Accents (10%)*: Bullseye crimson (`#DC2626`), tournament gold (`#F59E0B`), and vibrant turf green (`#10B981`).
- **Ergonomics**: Tactile 48px buttons, tabular numbers (`font-mono tabular-nums`), high contrast for outdoor daylight legibility, and seamless responsiveness from mobile thumb view to full desktop dashboard.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Flexible Photo Scorecard OCR with Player Disambiguation**
  - *Approach*: Server-side Gemini 3.8 Flash Vision prompt returns a structured array of player rows:
    ```json
    {
      "courseName": "Sharp Park Golf Course",
      "date": "2026-09-14",
      "detectedPlayers": [
        { "cardName": "Dave", "totalStrokes": 82, "scores": [...] },
        { "cardName": "Mike", "totalStrokes": 88, "scores": [...] }
      ]
    }
    ```
    The UI renders a dedicated **Player Disambiguation & Format Step** where the user can choose which row to ingest and map it to a specific member.
  - *Why*: Scorecards typically hold up to 4 players; this avoids parsing the wrong golfer's row and allows 1-click attribution to the right friend.

- **Decision 2: Game Format Classification for Scramble & Best Ball**
  - *Approach*: Explicit tagging of round type (`'individual'` vs `'team_scramble'` vs `'team_best_ball'`).
  - *Why*: Guarantees that scramble rounds (where a team might shoot a 60) are archived in the **Team Events Trophy Room** and strictly excluded from individual USGA/WHS handicap differential calculations.

- **Decision 3: Zero GPS Clutter**
  - *Approach*: No GPS permissions, distance calculating, or satellite rangefinders.
  - *Why*: Keeps battery drain low and scorekeeping ultra-fast on the tee box.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [ Client: React 19 + Tailwind v4 + Lucide + Motion ]                      │
│   ├── Navigation & Active Session State                                     │
│   ├── Views:                                                                │
│   │   ├── LiveRoundView (Tactile Thumb Scorer, Player Switcher)             │
│   │   ├── FormatScorecardView (Stroke, Stableford, Match Play, Scramble)    │
│   │   ├── LeaderboardView (Live Standings by Game Format)                   │
│   │   ├── CourseLibraryView (Pre-loaded Bay Area Munis + Custom Builder)    │
│   │   ├── HandicapProfileView (WHS Index, Differentials, Individual Stats)  │
│   │   ├── TeamEventsView (Scramble & Best Ball Archives & Event Trophies)   │
│   │   └── OcrScorecardModal (Photo Upload, Format Picker, Player Row Match) │
│   └── LocalStore / Offline Sync Cache                                       │
│         ▲                                         ▲                         │
│         │ Real-Time Sync                          │ Multipart Photo OCR     │
│         ▼                                         ▼                         │
│   [ Server: Express API + Session Sync Hub (server.ts) ]                    │
│   ├── /api/rooms/:code (Live multiplayer rounds & SSE updates)              │
│   ├── /api/courses (Bay Area courses: Harding, Presidio, Corica, Sharp, etc)│
│   ├── /api/rounds (Historical individual rounds with WHS differentials)     │
│   ├── /api/events (Scramble & Best Ball team tournament archives)           │
│   └── /api/scorecard-ocr (Server-side Gemini 3.8 Flash Vision OCR)          │
│         │                                                                   │
│         ▼                                                                   │
│   [ Google GenAI SDK: gemini-3.8-flash ]                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow for Photo Upload & Player Mapping
```
User Uploads Photo + Chooses Format (e.g. Scramble vs Individual)
                        │
                        ▼
            POST /api/scorecard-ocr
                        │
                        ▼
   Gemini 3.8 Flash Vision identifies Course, Date, and all Player Rows
                        │
                        ▼
   Client Modal renders "Choose Player Row":
   [•] Row 1: "Dave" (Total: 82)  -> Assign to: [ Dave W ]
   [ ] Row 2: "Mike" (Total: 88)  -> Assign to: [ Mike R ]
                        │
                        ▼
   User confirms hole-by-hole review table
                        │
                        ▼
   If Individual: Saved to /api/rounds -> updates WHS Handicap Index
   If Scramble/Team: Saved to /api/events -> updates Team Hall of Fame
```

---

## 5. Verification & Testing Plan

1. **Compilation & Build**:
   - Verify server and client compile cleanly with `npm run build` and `tsc --noEmit`.
2. **Scorecard Photo OCR & Player Row Selection**:
   - Verify image upload extracts multiple player rows from a card.
   - Verify user can select a specific player row and assign it to a group member.
   - Verify format selection (Scramble vs Individual) routes the saved round to the proper data store.
3. **Alternate Formats & Handicap Calculations**:
   - Verify Stableford point calculation and Match Play 1v1 status calculation.
   - Verify that Scramble and Best Ball rounds do not alter individual WHS handicap differentials.
4. **Multi-Device Live Sync**:
   - Verify room codes synchronize live score updates across multiple devices/tabs in real-time.
5. **Bay Area Course Library**:
   - Verify Harding Park, Presidio, Corica Park, Sharp Park, Half Moon Bay, etc. auto-populate pars, handicaps, and tees.
6. **Mobile Ergonomics**:
   - Verify glove-friendly 48px touch targets and responsive mobile/desktop layouts.

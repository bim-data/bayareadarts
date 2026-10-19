# Implementation Plan: Course Directory Scorecard, Admin Layout Editor & Map View

Expand the Course Directory with an expandable-style scorecard (hole number, par, yardage, and handicap index), an inline Admin Course Editor for updating hole layouts and course metadata directly from the UI into Firestore, and an interactive List/Map toggle mode.

---

## 1. User Requirements & Confirmed Specifications

1. **Course Scorecard View**:
   - In course detail view (when a course is selected from the directory), display a hole-by-hole scorecard in the exact visual style of the app's expandable scorecard (`ExpandableRoundCard`).
   - Include rows:
     - **Hole**: 1 to 9 (OUT), 10 to 18 (IN), and TOTAL (for 18-hole courses) or 1 to 9 (OUT) for 9-hole courses.
     - **Par**: Hole pars, plus OUT, IN, and TOTAL par summaries.
     - **Yardage**: Per-hole yardages, plus OUT, IN, and TOTAL yardage calculations.
     - **Handicap (HCP)**: Per-hole stroke index difficulty (1–18).
   - Match existing dark/light theme, border radius, crisp typography, and tabular figures.

2. **Admin Course & Layout Editor**:
   - Available to admins (checked via `useAuth().isAdmin`).
   - Admin action button ("Edit Course" / "Edit Layout") on the course detail card.
   - When in Edit Mode:
     - Inline text inputs for **City**, **Area / Region** (Peninsula, East Bay, SF, South Bay, North Bay, Other), and **Address** (wired up for future dataset additions).
     - Scorecard inputs for **Par** (quick increment/decrement or number entry), **Yardage** (editable text field as confirmed by user), and **Handicap** (stroke index difficulty).
     - Dynamic auto-calculation of OUT, IN, and TOTAL pars and yardages as the admin types.
     - **Save Changes** button that writes directly to Firestore via `updateRecord('courses', course.id, ...)` with feedback toast/notification.
     - **Cancel** button to revert unsaved draft edits.

3. **List & Map Mode in Course Directory**:
   - Clean segmented toggle switch at the top of the Course Directory modal: `List` and `Map`.
   - **List Mode**: The existing scannable course cards, search filter, and tee summary.
   - **Map Mode**:
     - Interactive map centered on Northern California / Bay Area courses.
     - Geocoded course pins mapped by address (or accurate city coordinates fallback for Bay Area cities: Palo Alto, Walnut Creek, Pleasanton, San Ramon, San Jose, San Francisco, Oakland, Berkeley, Sunnyvale, etc.).
     - Course pin markers display course names on hover/click with an info card popup (name, city, area badge, tee count, and "View Scorecard" action).
     - Live synchronization with search filter (filtering text updates pins dynamically).
     - Clicking a course pin opens the course detail & scorecard view.

---

## 2. Architecture & Design Specifications

- **Design System**: Strictly adhere to the Universal Frontend Design Constitution and SaaS/Dashboard guidelines:
  - Tabular numerals (`font-mono` / `tabular-nums`) for all numbers, yards, and pars.
  - Quiet, unboxed metadata separators (`·`) for city, state, and region.
  - Clean segmented control for List/Map toggle (functional `<button>` tabs with subtle active backgrounds, zero AI-slop pill badges).
  - High-contrast, dark-mode-native scorecard grid matching `ExpandableRoundCard` exactly (subtle 1px border lines, distinct OUT/IN/TOTAL summary headers).
- **Data Flow & Persistence**:
  - `src/types.ts`: Update `Course` interface with optional `address?: string`, `state?: string`, `latitude?: number`, `longitude?: number`.
  - `src/services/db.ts`: Leverage existing `updateRecord('courses', courseId, cleanCourseData)` for real-time Firestore synchronization.
  - `src/components/CourseLibraryModal.tsx`:
    - Add `isAdmin` from `useAuth` (or prop).
    - Add `viewMode`: `'list' | 'map'`.
    - Add scorecard renderer with Front 9 / Back 9 / Out / In / Total.
    - Add admin editing state and save handler `onUpdateCourse(course)`.
    - Render interactive map component with responsive container and geocoding dictionary.

---

## 3. Step-by-Step Implementation Steps

### Step 1: Type Definitions (`src/types.ts`)
- Update `Course` interface to include:
  - `address?: string`
  - `state?: string`
  - `latitude?: number`
  - `longitude?: number`

### Step 2: Course Scorecard Table Component (`src/components/CourseScorecardTable.tsx`)
- Build a dedicated, reusable scorecard component modeled after `ExpandableRoundCard.tsx`:
  - Front 9 table (Holes 1–9 + OUT).
  - Back 9 table (Holes 10–18 + IN, if 18 holes).
  - Combined TOTAL summary column.
  - Rows:
    - **Hole**: 1..9 | OUT | 10..18 | IN | TOTAL
    - **Par**: Hole pars + OUT / IN / TOTAL totals
    - **Yardage**: Per-hole yardage + OUT / IN / TOTAL totals
    - **Handicap (HCP)**: Per-hole difficulty index (1–18)
  - Supports both **Read-Only** view and **Admin Edit** mode:
    - In Edit Mode: Par controls, text input for Yardage (`type="text" pattern="[0-9]*"`), and Handicap input.
    - Live recalculation of OUT, IN, and TOTAL yardage and par sums.

### Step 3: Interactive Course Map (`src/components/CourseDirectoryMap.tsx`)
- Implement a responsive interactive map with Leaflet or lightweight Canvas/SVG interactive map with CartoDB/OpenStreetMap tiles:
  - Preloaded coordinates for Bay Area / Northern California golf regions and cities (Palo Alto, San Jose, Sunnyvale, Walnut Creek, Pleasanton, San Ramon, San Francisco, Oakland, Berkeley, Half Moon Bay, Napa, Sonoma, Monterey, etc.).
  - Geocode handler that falls back from `address` to `city, CA`.
  - Custom pin markers styled to match the dark emerald brand aesthetic.
  - Clickable markers with course card preview and quick "View Details & Scorecard" button.
  - Smooth zoom/pan controls and auto-fit bounds based on visible/filtered courses.

### Step 4: Integrate Scorecard, Admin Editor, and Map Toggle in `CourseLibraryModal.tsx`
- Add List / Map segmented toggle at the top next to the search input.
- In Course Detail view:
  - Render the Course Scorecard Table directly beneath the Available Tees.
  - If user is admin (`isAdmin`), render "Edit Course Layout" button.
  - When editing:
    - Allow updating City, Region/Area, and Address.
    - Allow modifying hole Pars, Yardages, and Handicap Indices in the scorecard table.
    - "Save to Firebase" button that calls `onUpdateCourse(updatedCourse)` and displays save status toast.
    - "Cancel" button to discard changes.
- In `App.tsx`:
  - Pass `onUpdateCourse` handler that calls `updateRecord('courses', updatedCourse.id, cleanData)` and updates local state.
  - Provide `isAdmin` to `CourseLibraryModal`.

### Step 5: Verification & Testing
- Test viewing course scorecards for 9-hole and 18-hole courses.
- Test Admin edit mode: modify yardage, par, handicap, city, and region, then save and verify persistent Firestore update.
- Test Map mode toggle: search filter synchronization, pin selection, and detail navigation.
- Verify production build with `compile_applet` and test responsiveness across mobile and desktop.

# Role-Based Access Control (RBAC) for Scorecard Editing & Deletion

Lock down score editing and deletion across player profiles, clubhouse drawers, and scramble events so that unauthorized visitors and non-owners cannot modify or delete scores.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following security and permission rules:
> - **Admin Designation**: In the database, the member profile has a `role` field set to `"admin"` (`role: "admin"`). Regular players do not have this field.
> - **Unauthorized Appearance**: Hide edit and delete buttons completely on read-only cards (no disabled padlock buttons or clutter).
> - **Individual Rounds**: Only the logged-in player who owns the round or an administrator can edit or delete.
> - **Scramble Squad Rounds**: Any player on the squad roster or an administrator can edit or delete.

- **Confirmed Decision 1**: Add `role?: 'admin' | string;` to `MemberProfile` in `src/types.ts`.
- **Confirmed Decision 2**: Expose `isAdmin` in `AuthContext` (`memberProfile?.role === 'admin'`).
- **Confirmed Decision 3**: Centralize permission checking in `ExpandableRoundCard` and `ExpandableTeamEventCard` so that edit and delete buttons are only rendered when authorization criteria are strictly met.

---

## 1. Overview & Core Concept

- **What It Does**: Establishes strict ownership and role verification for score records. Prevents anonymous visitors or other players from modifying another golfer's scorecard, handicap data, or scramble results.
- **Target Audience**: Golf club members and administrators who need data integrity for WHS handicaps and club tournaments.
- **Key Value**: Enforces true "Read-Only" protection when viewing other golfers' profiles while giving administrators full management capabilities.

---

## 2. User Experience & Permission Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PERMISSION MATRIX                               │
├─────────────────────┬───────────────────┬───────────────────┬───────────────┤
│ User State          │ Own Round Cards   │ Other Player Cards│ Scramble Squad│
├─────────────────────┼───────────────────┼───────────────────┼───────────────┤
│ Logged Out / Guest  │ Hidden (Read-Only)│ Hidden (Read-Only)│ Hidden        │
│ Regular Player (Me) │ Full Edit/Delete  │ Hidden (Read-Only)│ Edit if on    │
│                     │                   │                   │ squad roster  │
│ Admin (role=admin)  │ Full Edit/Delete  │ Full Edit/Delete  │ Full Edit/Del │
└─────────────────────┴───────────────────┴───────────────────┴───────────────┘
```

### Visual & Interactive Behavior
1. **Player History Modal (`PlayerHistoryModal.tsx`)**:
   - When viewing another player's profile: The top bar retains the `🔒 Read-Only` pill, and all child scorecard items (`ExpandableRoundCard`) hide the edit and delete buttons completely.
   - When viewing your own profile (or when an Admin views any profile): The cards show the Edit and Delete action controls.
2. **Clubhouse Hub Modal (`ClubhouseHubModal.tsx`)**:
   - The user's personal scores drawer allows edit/delete.
   - When browsing other members in the switch view, edit/delete buttons are hidden unless the active user is an admin.
3. **Scramble Team Events (`TeamHistoryModal.tsx` & `ExpandableTeamEventCard`)**:
   - Edit and Delete buttons on team event scorecards are hidden unless the current logged-in user is an administrator or is listed on the roster of that squad.

---

## 3. Technical Architecture & Implementation Steps

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      AUTH & PERMISSION ARCHITECTURE                       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
    [ AuthContext.tsx ]                               [ src/types.ts ]
    - currentUser (Firebase User)                     - MemberProfile.role:
    - memberProfile (Firestore doc)                     'admin' | undefined
    - isAdmin (boolean helper)
              │
              └───────────────────────┬───────────────────────┘
                                      ▼
                      [ Permission Evaluation Helper ]
            canEditRound(round, currentUser, memberProfile, isAdmin)
            canEditScramble(event, currentUser, memberProfile, isAdmin)
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
    [ ExpandableRoundCard.tsx ]                    [ ExpandableTeamEventCard ]
    - Evaluates canEdit                           - Checks roster membership
    - Conditionally renders Edit & Delete          - Conditionally renders Edit/Del
```

### Detailed Component Updates:
1. **`src/types.ts`**:
   - Add `role?: 'admin' | string;` to `interface MemberProfile`.
2. **`src/contexts/AuthContext.tsx`**:
   - Add `isAdmin: boolean` to `AuthContextType`, defined as `memberProfile?.role === 'admin'`.
3. **`src/components/ExpandableRoundCard.tsx`**:
   - Add permission check:
     `const canEdit = !!(currentUser && (isAdmin || currentUser.uid === round.playerId || memberProfile?.id === round.playerId || memberProfile?.name.toLowerCase() === round.playerName.toLowerCase()));`
   - Only render the Edit button and Delete button if `canEdit` is true.
4. **`src/components/TeamHistoryModal.tsx` (`ExpandableTeamEventCard`)**:
   - Add permission check for scramble events:
     `const isSquadMember = event.teamLeaderboard.some(t => t.playerNames.some(pName => pName.toLowerCase() === (memberProfile?.name || '').toLowerCase() || (memberProfile?.nickname && pName.toLowerCase() === memberProfile.nickname.toLowerCase())));`
     `const canEditEvent = !!(currentUser && (isAdmin || isSquadMember));`
   - Only render the Edit button and Delete button if `canEditEvent` is true.
5. **`src/components/PlayerHistoryModal.tsx`**:
   - Ensure `ExpandableRoundCard` and `ExpandableTeamEventCard` are passed authorization context so that viewing another player's profile is strictly read-only.

---

## Verification Plan

1. **Unauthenticated / Guest Test**:
   - Log out of the application.
   - Open any player profile in the roster. Verify that no edit stepper buttons, edit pencil icons, or delete trash cans appear. The scorecard expands cleanly in read-only mode.
2. **Logged-In Player Test (Non-Admin)**:
   - Log in as a regular player.
   - Open your own profile: verify edit and delete buttons are fully functional.
   - Open another player's profile: verify edit and delete buttons are completely hidden.
   - Open a scramble event: verify you can only edit events where you are on the team roster.
3. **Administrator Test (`role: "admin"`)**:
   - Log in as an account with `role: "admin"`.
   - Open another player's profile and scramble event: verify edit and delete buttons are visible and functional.
4. **Compilation Verification**:
   - Run `lint_applet` and `compile_applet` to confirm zero TypeScript or build issues.

# Stage mobile redesign — handoff for Claude Code

> Décision de Lutina (29 oct 2026) : ce visuel est la cible. Les 33 écrans de l'app doivent être appliqués comme dans les maquettes. Claude Code implémente.

## Goal

Restyle the whole Expo app (`eafc-app`) so every screen matches the mockups in `docs/design/stage-mockups/`. The mockups are the visual source of truth: layout, colours, spacing, typography, components, tab bar.

**Restyle only.** Keep all existing behaviour: data fetching, Supabase/API calls, zustand stores, navigation params, i18n `t()` keys, `testID`s, deep links, Live Dark wallpaper mode. The names, scores and STC amounts in the mockups are fake demo data — always render the real data the screen already loads.

## How to read the mockups

Each `*.dc.html` file is one phone screen (390×844) written in HTML with inline styles plus a shared `<style>` block at the top (classes `.card`, `.btn`, `.chip`, `.ib`, `.tabs`, …). Open them in a browser or read the markup. Ignore the `<x-dc>`, `<helmet>`, `support.js` and `DCLogic` script — they belong to the design tool. `href="X.dc.html"` links show the intended navigation between screens.

## Design tokens (put these in one place first)

| Token | Value | Use |
|---|---|---|
| `bg` | gradient (see below), fallback `#03153F` | screen background |
| `bgDeep` | `#07163A` | inputs, tab bar, headers, segmented control track |
| `card` | `#132B5C` | cards, icon buttons, chips |
| `cardHi` | `#16346B` | highlighted card (next match, my row, selected option) |
| `border` | `#234480` | card / input / divider borders (1px) |
| `borderStrong` | `#4A6AA5` | dashed upload zones, radio rings |
| `text` | `#EAF2FF` | primary text |
| `textSoft` | `#C9D8EE` | body copy, chip text |
| `muted` | `#9FB3D1` | secondary text, labels (replaces `#6B7280`, which fails contrast on navy) |
| `cyan` | `#4A6AA5` | primary accent, primary button bg, active tab, links |
| `cyanHi` | `#5B79AF` | pressed/hover state, avatar initials |
| `aqua` | `#3C5E99` | accent border on highlighted cards |
| `onCyan` | `#EAF2FF` | text/icons on cyan |
| `success` | `#4ADE80` (bg `#14532D`) | wins, checks, completed |
| `danger` | `#F87171` (bg `#5B1A1A`) | losses, decline, sign out |
| `warning` | `#FBBF24` (bg `#2A2418`, border `#B45309`) | contract reminders, "Needs action" |

**Screen background (updated 6 Nov 2026, matches the logo artwork):** every screen uses the same blue gradient, not a flat colour. Layers, top to bottom:
1. radial glow at the bottom centre (ellipse ~75% wide × 42% high, centred at 50% / 78%): `rgba(0,82,140,0.95)` → transparent at ~72%
2. radial glow at the top centre (ellipse ~90% × 35%, centred at 50% / 0%): `rgba(14,58,124,0.9)` → transparent at ~75%
3. horizontal linear gradient: `#020C30` (left) → `#06306A` (centre) → `#020C30` (right)

In React Native build this once in `Screen` (e.g. `expo-linear-gradient` for layer 3 plus two blurred/radial overlays, or one pre-rendered background image at 3× in `assets/brand/`). Full-width header bands sit on top as `rgba(2,12,48,0.35)`, not a solid colour. Light theme keeps its own flat background.

Radii: card 16 · button 14 · input/icon button 12 · chip 999 · tab bar 22 · avatar tile 12.
Spacing: screen padding 20 horizontal, content gap 14–16, card padding 16.
Sizes: primary/secondary button height 52, icon button 44×44, chip height 34, input height 50, touch targets ≥ 44.
Type: headings UPPERCASE in the existing `EASports15` font (`fontFamily: heading`; the mockups used Saira Condensed only as a stand-in), letter-spacing ~0.03em; screen titles 34, hero titles 38–40. Section labels: 11px, weight 600, uppercase, letter-spacing 0.12em, `muted`. Body: system font 14–15.
Icons: `@expo/vector-icons` Ionicons outline at 22px, stroke look as in the mockups. No emoji.

Update `tailwind.config.js` colours and `src/store/themeStore` / `src/lib/stageTheme.js` tokens to these values so the dark theme *is* this design. Keep the light theme working, but dark is the target.

## Logo (added 6 Nov 2026)

Official Stage logo files are in `assets/brand/` (white on transparent, made from Lutina's logo):

| File | Use |
|---|---|
| `stage-logo.png` (1600×304) | lockup "STAGE" + stadium — Welcome screen (width ~320), Login (~160), Home header top-left (~108), splash |
| `stage-icon.png` (461×220) | stadium mark alone — large faded watermark on Welcome (opacity ~0.16), small brand spots, loading states |
| `stage-app-icon.png` (1024×1024, navy `#0A1F4A` bg) | `app.json` → `icon` |
| `stage-adaptive-icon.png` (1024×1024, transparent, mark in safe zone) | Android `adaptiveIcon.foregroundImage` |
| `stage-splash.png` (1284×2778, navy bg) | `expo-splash-screen` image |

Tasks: build a `BrandLogo` component (`variant="lockup" | "mark"`, `width` prop, keeps aspect ratio, `accessibilityLabel="Stage"`); use it where the mockups show it (Welcome, Login, Home header); replace the old `logo-lockup.png` / `logo-mark.png` / `stadium-logo.png` usages (currently `src/app/auth/welcome.jsx`); point `app.json` icon, adaptive icon and splash to the new files and set their `backgroundColor` to `#0A1F4A`. Do not delete the old asset files.

## Shared components to build first (`src/components/ui/`)

`Screen` (bg, safe-area top padding, 20px gutters, bottom space for the floating tab bar) · `Card` (+ `highlight` variant) · `Button` (primary cyan / secondary outline / danger outline) · `IconButton` · `Chip` (+ `active`) · `SegmentedControl` · `SectionLabel` · `Avatar` (initials tile, round variant for crests) · `TextField` / `SelectField` with label · `ListRow` (icon, title, value, chevron) · `Toggle` · `StepProgress` (onboarding 4 bars) · `FormBadge` (W/D/L) · `StatGrid`.

Then the **floating tab bar** in `src/app/(tabs)/_layout.jsx`: 16px from the sides, 24px from the bottom, height 64, radius 22, `bgDeep` + border, 5 icon-only tabs (Home, Game Day, Tournaments, Profile, Search), active tab = cyan icon on a `card` pill. Keep NativeTabs on iOS if it can be styled; otherwise use the custom bar on both platforms.

## Screen mapping (mockup → file)

### 1 · Onboarding & compte — `mockups/1-onboarding/`
| Mockup | File(s) |
|---|---|
| Welcome | `src/app/auth/welcome.jsx` |
| Login | `src/app/auth/loginscreen.jsx` |
| Signup | `src/app/auth/signupscreen.jsx`, `registerscreen.jsx` |
| Platform | `src/app/auth/platformselection.jsx` |
| Position | `src/app/auth/positionselection.jsx` (pitch with position bubbles) |
| Gamertag | `src/app/auth/gamertagsetup.jsx` |
| ClubSetup | `src/app/auth/clubsetup.jsx` (+ `onboarding.jsx` follows the same step style) |

### 2 · Home & Game Day — `mockups/2-home-gameday/`
| Home | `src/app/(tabs)/dashboard/index.jsx`, `playerdashboardscreen.jsx`, `src/components/dashboard/*` |
|---|---|
| GameDay | `src/app/(tabs)/matches/index.jsx` (Fixtures / Calendar / Results segmented, Arrange Game) |
| MatchDetail | `src/app/(tabs)/matches/matchdetailscreen.jsx` |
| WatchMatch | `src/app/(tabs)/matches/watchmatchscreen.jsx` |
| UploadVideo | `src/app/(tabs)/matches/uploadvideoscreen.jsx` |
| Search | `src/app/(tabs)/search/index.jsx`, `searchplayer.jsx`, `searchclubs.jsx` (Players/Clubs segmented) |

### 3 · Tournois — `mockups/3-tournaments/`
| Tournaments | `src/app/(tabs)/tournaments/index.jsx`, `tournamentlistscreen.jsx` |
|---|---|
| TournamentDetail | `tournamentdetailscreen.jsx` |
| CreateTournament | `createtournamentscreen.jsx` |
| GroupStage | `groupstagescreen.jsx` |
| Standings | `leaguestandingsscreen.jsx`, `src/app/apps/leagues/[slug].jsx` |
| Fixtures | `fixturesscreen.jsx` |
| Bracket | `bracketscreen.jsx` |

### 4 · Profil & équipes — `mockups/4-profile-teams/`
| Profile | `src/app/(tabs)/profile/index.jsx`, `profilescreen.jsx`, `clubProfileTabs.jsx` |
|---|---|
| EditProfile | `editprofilescreen.jsx` |
| Availability | `availabilityscreen.jsx` |
| TeamProfile | `src/app/teams/teamprofilescreen.jsx` |
| CreateTeam | `src/app/teams/createteamscreen.jsx` |

### 5 · Apps — `mockups/5-apps/`
| Apps | `src/components/apps/AppDirectoryScreen.jsx`, `src/app/apps/[slug].jsx` |
|---|---|
| Inbox | `src/app/apps/inbox/index.jsx`, `src/components/inbox/*` |
| InboxMessage | `src/app/apps/inbox/[id].jsx` |
| Wallet | `src/app/apps/wallet.jsx` |
| Store | `src/app/apps/store.jsx` |
| Transfers | `src/app/apps/transfers.jsx` |
| Settings | `src/app/apps/settings.jsx`, `src/components/settings/*` |
| Club | `src/app/apps/club/[id].jsx` |

Screens without their own mockup (`competitions`, `competitions/[slug]`, `find-clubs`, `find-players`, `apps/register`, `auth/callback`, `teams/index`) get the same components and patterns as their closest mockup.

## Order of work

1. Tokens + `src/components/ui/` + floating tab bar.
2. Section 1 → 5, one section at a time. After each section: run `yarn test`, fix broken tests (update snapshots only when the change is the intended restyle), and post a short report (files changed, anything you could not match and why).
3. Do not change API calls, store logic or navigation structure. If a mockup shows something the screen has no data for, leave that element out and list it in the report — do not invent data.

## Rules

- Do not commit or push unless Lutina asks. (The git root is one level up: `~/Documents/eafc`.)
- Keep `testID`s and i18n keys; new visible strings go through the existing translation packs.
- Accessibility: `accessibilityLabel` on icon-only buttons, contrast as in the token table.
- Live Dark wallpaper mode must keep working on top of the new surfaces.

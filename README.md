# Property Search

A React Native (Expo) property-search app backed by Supabase. Browse listings, save favorites, chat with owners, and (for admins) manage banners, listings, users, and analytics.

---

## Tech Stack

- **Framework:** [Expo SDK 54](https://docs.expo.dev) + [Expo Router 6](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Runtime:** React Native 0.81 + React 19
- **Styling:** [`react-native-unistyles`](https://www.unistyl.es/) v3 (themed `StyleSheet.create`, JSI bindings, no re-renders on theme change)
- **Auth & Data:** [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript) v2 with `AsyncStorage` session persistence
- **Animation:** `react-native-reanimated` v4
- **Icons:** `@expo/vector-icons` (Feather)
- **Package manager:** [`pnpm`](https://pnpm.io/)

---

## Getting Started

### Prerequisites

- Node.js 20+
- `pnpm` (`npm i -g pnpm`)
- iOS: Xcode + CocoaPods (macOS only)
- Android: Android Studio + an emulator or device
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) for local DB work

### Install

```bash
pnpm install
```

### Environment

Create a `.env` file at the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<your-anon-key>
```

> Only the **anon** key belongs in the client — never ship the service-role key. Anything sensitive must live in Edge Functions / server code.

### Run

```bash
pnpm start          # Expo dev server (dev client)
pnpm ios            # Run on iOS simulator
pnpm android        # Run on Android emulator
pnpm web            # Run web build
pnpm lint           # Expo ESLint
```

---

## Project Structure

```
property-search/
├── app/                     # Expo Router routes ONLY (no business logic, no shared components)
│   ├── _layout.tsx          # Root layout: AuthProvider + LocationProvider + RootNavigator + Stack
│   ├── (auth)/              # Auth route group (login, signup, forgot/reset password, verify-email)
│   ├── (tabs)/              # Tab route group (index/home, chat, favorites, profile)
│   ├── admin/               # Admin routes (dashboard, banners, listings, users, analytics)
│   ├── property/            # Property detail routes
│   │   ├── [id].tsx         # Dynamic property detail (hero gallery + interactive map)
│   │   └── [id]/ai-chat.tsx # Nested AI chat
│   ├── profile/[id].tsx     # Public user profile
│   ├── conversation/[id].tsx# Searcher ↔ owner messaging thread
│   ├── location-picker.tsx  # Modal route — set/update current location
│   └── search.tsx           # Search screen
├── components/
│   ├── ui/                  # Reusable design-system primitives (Button, Input, Banner, AuthScreen, BottomSheet, Chip, ChipGroup, RangeSlider, Section, icon-symbol)
│   ├── property/            # Domain components (PropertyCard, CategoryTabs, BannerCarousel, PropertyCardSkeleton, FilterSheet)
│   ├── admin/               # Admin-only shared components (PropertyForm)
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── constants/colors.ts      # Single source of truth for color palette (light + dark)
├── contexts/                # auth-context, location-context, search-session-context
├── hooks/                   # useSearch, useHomeData, useAnalytics
├── utils/                   # supabase, conversations, filters, propertyHelpers, uploadImage, validation
├── supabase/
│   ├── config.toml          # Local Supabase CLI config
│   └── migrations/          # SQL migrations (numbered, append-only)
├── assets/                  # Fonts, images, splash, icons
├── android/                 # Native Android project (managed by Expo prebuild)
├── unistyles.ts             # Theme/breakpoint registration (imported once from app/_layout.tsx)
├── app.json                 # Expo config
└── index.ts                 # Expo Router entry
```

**Placement rules**

- `app/` contains **only** screens that map to a URL — no shared components, hooks, or utilities.
- Reusable, domain-agnostic UI lives in `components/ui/`.
- Domain-specific reusable components live in `components/<domain>/` (e.g. `components/property/`).
- Cross-screen state lives in `contexts/`. Pure functions live in `utils/`.
- Colors and other design tokens belong in `constants/`, then are consumed by `unistyles.ts`.

---

## Design System

The design system is centralized — **never hardcode colors, font sizes, spacing values, or radii in screens or components.** Always read from the theme.

### Golden rules

1. **No hardcoded colors anywhere outside [constants/colors.ts](constants/colors.ts).** No hex, `rgb()`, `rgba()`, or named colors. Add missing colors to **both** `light` and `dark` with a semantic name, then use `theme.colors.<name>`.
2. **Semantic names only** — `tint`, `text`, `accent`, `onImage`, `scrim`. Never `blue500` or `white`.
3. **UI on top of photography** uses on-image tokens (constant across themes): `onImage`, `onImageMuted`, `scrim`, `scrimStrong`, `backdrop`.
4. **Reuse before you build.** Check [components/ui/](components/ui/) and [components/property/](components/property/) first. If a primitive is close but not exact, add a `variant` — don't fork.
5. **All spacing, radii, typography, and shadows go through the theme**: `theme.spacing(n)`, `theme.radii.*`, `theme.typography.*`, `theme.shadows.*`. No raw px for layout, no inline `fontSize`/`fontWeight`.

### Theme tokens

- `theme.colors.*` — from [constants/colors.ts](constants/colors.ts)
- `theme.spacing(n)` — multiples of 8px (e.g. `spacing(2)` = 16px)
- `theme.radii` — `sm` (8) · `md` (16) · `lg` (24) · `xl` (32) · `round` (9999)
- `theme.typography` — `h1`, `h2`, `h3`, `body`, `label`, `caption`
- `theme.shadows` — `soft`, `strong`
- `breakpoints` — `xs` (0) · `sm` (360) · `md` (500) · `lg` (800) · `xl` (1200)
- `settings.adaptiveThemes: true` — light/dark follow system automatically.

### Writing styles

Always use the function form so the theme is injected and styles update automatically.

```tsx
import { StyleSheet } from 'react-native-unistyles';

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing(2),
    borderRadius: theme.radii.lg,
    ...theme.shadows.soft,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
}));
```

For multi-state components, prefer `variants` + `styles.useVariants(...)` over chained `style={[...]}` ternaries. See [components/ui/Button.tsx](components/ui/Button.tsx) as the canonical example.

---

## Routing (Expo Router)

- File-based routing in [app/](app/). Folders in parens (`(auth)`, `(tabs)`) are **route groups** — they organize without affecting the URL.
- Each group has its own `_layout.tsx` defining navigation (Stack, Tabs).
- Dynamic segments use `[param]` (e.g. [app/property/\[id\].tsx](app/property/[id].tsx)).
- [app/_layout.tsx](app/_layout.tsx) is the root: imports `unistyles.ts` first, wraps everything in `AuthProvider`, then renders `RootNavigator` which guards routes by session state.
- Keep screen files **thin** — compose UI from `components/`, lift logic into hooks/contexts/utils. If a screen file grows past ~150 lines, extract pieces.

---

## Supabase

### Client

The shared client lives at [utils/supabase.ts](utils/supabase.ts) and is configured with `AsyncStorage`, `autoRefreshToken`, `persistSession`, and `detectSessionInUrl: false`. Always import this client — do not create additional ones.

### Auth

All auth flows go through `useAuth()` from [contexts/auth-context.tsx](contexts/auth-context.tsx), which exposes `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`, `resendVerificationEmail`, plus reactive `session`, `user`, and `isLoading`.

- Never call `supabase.auth.*` directly from a screen — go through the context.
- Deep-link tokens (password reset / email verify) are handled in the provider via `expo-linking`.
- Route guarding lives in [app/_layout.tsx](app/_layout.tsx) (`RootNavigator`).

### Row Level Security (RLS)

RLS is **non-negotiable** — the anon key ships in the app bundle, so the database is the only place to enforce access.

- Every user-owned table has a `user_id` column referencing `auth.users(id)`.
- Policies for `select`, `insert`, `update`, `delete` are explicit. Default to `using (auth.uid() = user_id)` and `with check (auth.uid() = user_id)`.
- New tables get policies in the **same migration** that creates them.

### Migrations

- Live in [supabase/migrations/](supabase/migrations/). Numbered prefix (`00001_`, `00002_`, ...). **Append-only — never edit a committed migration.**
- One logical change per migration. Schema and RLS for the same table go together.

```bash
supabase start              # Start local stack
supabase db reset           # Recreate local DB from migrations (wipes local data)
supabase migration new <name>
supabase db push            # Push to remote
```

---

## TypeScript & Code Style

- TS strict (per [tsconfig.json](tsconfig.json)).
- Use the `@/*` path alias for absolute imports (`@/components/ui/Button`, `@/contexts/auth-context`).
- Prefer typed prop interfaces over inline types when a component is exported.
- File names: `PascalCase.tsx` for components in `components/`. Route files in `app/` follow Expo Router's `kebab-case.tsx` convention.
- Group imports: external → internal (`@/...`) → relative.

---

## Consistency Checklist (read before editing UI)

- [ ] **No hardcoded colors.** All colors come from `theme.colors.*` with semantic names.
- [ ] **On-image content uses on-image tokens** (`onImage`, `onImageMuted`, `scrim`, `scrimStrong`, `backdrop`).
- [ ] **Reusable component check.** Searched [components/ui/](components/ui/) and [components/property/](components/property/) first. Patterns repeated twice are extracted.
- [ ] All spacing uses `theme.spacing(n)`.
- [ ] All radii use `theme.radii.*`.
- [ ] All text styles spread `theme.typography.*`.
- [ ] All shadows spread `theme.shadows.*`.
- [ ] Stylesheet defined via `StyleSheet.create((theme) => ({...}))`.
- [ ] Multi-state visuals use `variants` + `styles.useVariants(...)`, not chained ternaries.
- [ ] No direct `supabase.auth.*` calls in screens — go through `useAuth()`.
- [ ] New tables include RLS policies in the same migration.
- [ ] If folder structure changed, the tree above and in [CLAUDE.md](CLAUDE.md) §2 was updated in the same change.

---

## Contributing

See [CLAUDE.md](CLAUDE.md) for the full contributor guide — it is the source of truth for design system rules, structure, and Supabase conventions.

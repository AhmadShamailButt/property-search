# CLAUDE.md

Guide for Claude (and human contributors) when working in this repository. The intent is to keep the design system consistent, the data layer secure, and the project structure predictable.

---

## 1. Project Overview

A React Native (Expo) property-search app backed by Supabase.

- **Framework:** Expo SDK 54 + Expo Router 6 (file-based routing) + React Native 0.81 + React 19
- **Styling:** `react-native-unistyles` v3 (themed `StyleSheet.create`, JSI bindings, no re-renders on theme change)
- **Auth & Data:** `@supabase/supabase-js` v2 with `AsyncStorage` session persistence
- **Animation:** `react-native-reanimated` v4
- **Icons:** `@expo/vector-icons` (Feather)
- **Package manager:** `pnpm`

---

## 2. Project Structure

> **IMPORTANT:** Whenever a folder is added, removed, or renamed, update the tree below in the same change. This section is the source of truth for layout — keep it accurate.

```
property-search/
├── app/                          # Expo Router routes ONLY (no business logic, no shared components)
│   ├── _layout.tsx              # Root layout: AuthProvider + LocationProvider + RootNavigator + Stack
│   ├── (auth)/                  # Auth route group (login, signup, forgot/reset password, verify-email)
│   ├── (tabs)/                  # Tab route group (index/home, chat, favorites, profile)
│   ├── admin/                   # Admin routes (dashboard, banners, listings, users)
│   ├── property/                # Property detail routes
│   │   ├── [id].tsx             # Dynamic property detail (hero gallery + interactive map)
│   │   └── [id]/ai-chat.tsx     # Nested AI chat
│   ├── location-picker.tsx      # Modal route — set/update current location
│   └── search.tsx               # Search screen
├── components/
│   ├── ui/                      # Reusable design-system primitives (Button, Input, Banner, AuthScreen, BottomSheet, Chip, ChipGroup, RangeSlider, Section, icon-symbol)
│   ├── property/                # Domain-specific reusable components (PropertyCard, CategoryTabs, BannerCarousel, PropertyCardSkeleton, FilterSheet)
│   ├── themed-text.tsx          # Themed Text wrapper
│   └── themed-view.tsx          # Themed View wrapper
├── constants/
│   └── colors.ts                # Single source of truth for color palette (light + dark)
├── contexts/
│   ├── auth-context.tsx         # Supabase session/user provider + auth methods
│   └── location-context.tsx     # Current location (city) — persisted to AsyncStorage + profiles.location
├── hooks/
│   ├── useSearch.ts             # Search results + filters (debounced supabase query)
│   └── useHomeData.ts           # Home-screen data: useProperties, useBanners, useFavorites
├── utils/
│   ├── filters.ts               # Filters/categories types + parse/serialize/format helpers
│   ├── supabase.ts              # Supabase client (configured with AsyncStorage)
│   └── validation.ts            # Form validators (email, password, etc.)
├── supabase/
│   ├── config.toml              # Local Supabase CLI config
│   └── migrations/              # SQL migrations (numbered, append-only)
├── assets/                      # Fonts, images, splash, icons
├── android/                     # Native Android project (managed by Expo prebuild)
├── unistyles.ts                 # Theme/breakpoint registration (imported once from app/_layout.tsx)
├── app.json                     # Expo config
├── babel.config.js
├── eslint.config.js
├── tsconfig.json
├── index.ts                     # Expo Router entry
└── package.json
```

**Rules of placement:**
- `app/` contains only screens that map to a URL. No shared components, hooks, or utilities live here.
- Reusable, domain-agnostic UI lives in `components/ui/`.
- Domain-specific reusable components live in `components/<domain>/` (e.g. `components/property/`).
- Cross-screen state lives in `contexts/`. Pure functions live in `utils/`.
- Colors and other design tokens belong in `constants/`, then are consumed by `unistyles.ts`.

---

## 3. Design System & Styling

The design system is centralized — **never hardcode colors, font sizes, spacing values, or radii in screens or components.** Always read from the theme.

### 3.0 Golden Rules (non-negotiable)

These rules apply to every screen, component, and PR. If you cannot satisfy one, add the missing token / extract the missing component first — do not hardcode.

1. **No hardcoded colors anywhere outside `constants/colors.ts`.** This includes hex (`#fff`, `#0F172A`), `rgb()`, `rgba()`, and named colors (`'white'`, `'black'`, `'transparent'` is the only allowed literal). If a color is missing, add it to **both** `light` and `dark` in `constants/colors.ts` with a semantic name, then use `theme.colors.<name>`.
2. **Always use semantic names**, not value-based names. Use `theme.colors.tint`, `text`, `accent`, `onImage`, `scrim` — never names like `blue500` or `white`. The same semantic key must exist in both light and dark themes.
3. **For UI sitting on top of photography/images**, use the on-image tokens (which intentionally stay constant across themes): `theme.colors.onImage`, `onImageMuted`, `scrim`, `scrimStrong`, `backdrop`. Do not write `'#fff'` or `'rgba(0,0,0,0.x)'` for overlays.
4. **Reuse before you build.** Before writing a `<TouchableOpacity>`, `<TextInput>`, card, or screen wrapper, check `components/ui/` and `components/property/`. If the existing primitive is close but not exact, add a `variant` to it — don't fork. If a pattern appears (or is about to appear) in two places, extract it.
5. **All spacing, radii, typography, and shadows go through the theme** (`theme.spacing(n)`, `theme.radii.*`, `theme.typography.*`, `theme.shadows.*`). No raw px for layout, no inline `fontSize`/`fontWeight` for text styles.

### 3.1 Colors (`constants/colors.ts`)

`Colors.light` and `Colors.dark` define every semantic color the app uses. The keys are intentional — use the semantic key, not the raw hex:

- **Core:** `primary`, `primaryLight`, `primaryDark`, `secondary`, `secondaryLight`, `secondaryDark`, `accent`
- **Text:** `text`, `textSecondary`, `textMuted`, `textInverse`
- **Backgrounds:** `background`, `backgroundSecondary`, `card`, `surface`
- **UI:** `border`, `divider`, `icon`, `tint`
- **Tab bar:** `tabIconDefault`, `tabIconSelected`
- **Status:** `success`, `warning`, `error`, `info` (+ `*Bg` tinted variants)
- **Domain (property):** `price`, `badge`, `favorite`, `rating`, `shadow`, `shadowStrong`
- **On-image / overlay (theme-constant):** `onImage` (white text/icon on photos), `onImageMuted` (de-emphasized white), `scrim` (light dark overlay for icon buttons on images), `scrimStrong` (banner gradient overlay), `backdrop` (modal/bottom-sheet backdrop)

When a new color is needed, add it to **both** `light` and `dark` in `constants/colors.ts` with a semantic name. Do not introduce raw hex values inline. The on-image tokens intentionally hold the same value in both themes because they sit on photography, not on app surfaces.

### 3.2 Theme (`unistyles.ts`)

Themes wrap `Colors` with the rest of the design tokens. Use these — do not invent your own scales.

- `theme.colors.*` — from `constants/colors.ts`
- `theme.spacing(n)` — multiples of 8px (e.g. `spacing(2)` = 16px). Always use this, never raw px for padding/margin/gap.
- `theme.radii` — `sm` (8) · `md` (16) · `lg` (24) · `xl` (32) · `round` (9999)
- `theme.typography` — `h1`, `h2`, `h3`, `body`, `label`, `caption` — spread these into text styles.
- `theme.shadows` — `soft`, `strong` — spread into elevated surfaces.
- `breakpoints` — `xs` (0) · `sm` (360) · `md` (500) · `lg` (800) · `xl` (1200)
- `settings.adaptiveThemes: true` — light/dark follow system automatically.

### 3.3 Writing Styles

**Always** use `StyleSheet.create((theme) => ({ ... }))` from `react-native-unistyles`. Pass a function so the theme is injected and styles update automatically when the theme changes.

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

When a component needs the live theme value at runtime (e.g. for an icon `color` prop or conditional logic), use the hook:

```tsx
import { useUnistyles } from 'react-native-unistyles';

const { theme, rt } = useUnistyles();
// rt.themeName === 'dark' to branch on theme
```

### 3.4 Variants (preferred over conditional `style={[...]}` chains)

For components with multiple visual states (size/variant/tone), use Unistyles `variants` and call `styles.useVariants(...)`:

```tsx
styles.useVariants({ variant, size });

const styles = StyleSheet.create((theme) => ({
  button: {
    variants: {
      size: {
        sm: { height: 36, paddingHorizontal: theme.spacing(2) },
        md: { height: 48, paddingHorizontal: theme.spacing(3) },
        lg: { height: 56, paddingHorizontal: theme.spacing(4) },
      },
      variant: {
        primary: { backgroundColor: theme.colors.tint, ...theme.shadows.soft },
        outline: { borderWidth: 1, borderColor: theme.colors.border },
        ghost: { backgroundColor: 'transparent' },
      },
    },
  },
}));
```

See `components/ui/Button.tsx` as the canonical example.

### 3.5 Reusable Components — When to Build One

Before adding inline UI to a screen, check `components/ui/` and `components/property/`. **If the same pattern appears twice, extract it.** Existing primitives:

- `Button` — variants `primary | outline | ghost`, sizes `sm | md | lg`, supports `icon`, `isLoading`, `fullWidth`.
- `Input` — labelled text input with optional left icon and error state.
- `Banner` — tone-based status banner.
- `AuthScreen` + `AuthFooterLink` — wrapper for all auth screens (handles SafeArea, KeyboardAvoidingView, header animation, footer link). All five auth screens compose this.
- `PropertyCard` — domain card for property listings.
- `CategoryTabs` — horizontal tab selector.
- `ThemedText` / `ThemedView` — themed wrappers; prefer these over raw `<Text>` / `<View>` when displaying themed text/backgrounds.
- `IconSymbol` — cross-platform icon wrapper (`.tsx` + `.ios.tsx`).

**Rules for new reusable components:**
1. Live in `components/ui/` (generic) or `components/<domain>/` (domain-specific).
2. Accept a typed `Props` interface — extend the underlying RN prop type when wrapping (`extends TouchableOpacityProps`, `TextInputProps`, etc.).
3. Style purely from `theme.*` — no hardcoded colors/spacing.
4. Expose visual variations via `variants`, not boolean prop sprawl.
5. Use `useUnistyles()` only when you need the live theme value in JS (icon color, conditional). Otherwise let `StyleSheet.create` handle styling.

---

## 4. Routing (Expo Router)

- File-based routing in `app/`. Folders in parens (`(auth)`, `(tabs)`) are **route groups** — they organize without affecting the URL.
- Each group has its own `_layout.tsx` that defines navigation (Stack, Tabs).
- Dynamic segments use `[param]` (e.g. `app/property/[id].tsx`).
- `app/_layout.tsx` is the root: it imports `unistyles.ts` (must be the first import), wraps everything in `AuthProvider`, then renders `RootNavigator` which guards routes by session state.
- Keep screen files **thin** — compose UI from `components/`, lift logic into hooks/contexts/utils. If a screen file grows past ~150 lines, extract pieces.

---

## 5. Supabase

### 5.1 Client (`utils/supabase.ts`)

The client is configured with `AsyncStorage`, `autoRefreshToken`, `persistSession`, and `detectSessionInUrl: false` (correct for native). Do not create additional Supabase clients — import this one.

### 5.2 Environment Variables

Use `EXPO_PUBLIC_` prefix for anything that needs to reach the client:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_KEY` (anon key only — never the service role key)

Service-role keys must never ship to the client. Put them in Edge Functions / server only.

### 5.3 Auth (`contexts/auth-context.tsx`)

All auth flows go through `useAuth()`. The provider exposes `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`, `resendVerificationEmail`, plus reactive `session`, `user`, and `isLoading`.

- Never call `supabase.auth.*` directly from a screen — go through the context so the rest of the app stays in sync.
- The provider also handles deep-link tokens (password reset / email verify) via `expo-linking`.
- Route guarding lives in `app/_layout.tsx` (`RootNavigator`) — it redirects to `/(auth)/login` when no session, or to `/(tabs)` when a session exists in the auth group.

### 5.4 Row Level Security (RLS)

**Always turn on RLS on every table that holds user data.** This is non-negotiable — the anon key ships in the app bundle, so the database is the only place to enforce access.

- Every user-owned table has a `user_id` column referencing `auth.users(id)`.
- Policies: `select`, `insert`, `update`, `delete` are explicit. Default to `using (auth.uid() = user_id)` and `with check (auth.uid() = user_id)`.
- New tables get policies in the same migration that creates them.

### 5.5 Migrations (`supabase/migrations/`)

- Numbered prefix (`00001_`, `00002_`, ...). Append-only — never edit a committed migration.
- One logical change per migration. Include both schema and RLS policy changes for the same table together.
- Run locally with `supabase db reset` (caution: wipes local DB). Push to remote with `supabase db push`.

---

## 6. TypeScript & Code Style

- TS strict (per `tsconfig.json`). Use the `@/*` path alias for absolute imports (`@/components/ui/Button`, `@/contexts/auth-context`).
- Prefer typed prop interfaces over inline types when a component is exported.
- Component file names: `PascalCase.tsx` for components in `components/`. Route files in `app/` follow Expo Router's `kebab-case.tsx` convention.
- Keep imports grouped: external → internal (`@/...`) → relative.

---

## 7. Commands

```bash
pnpm start          # Expo dev server (dev client)
pnpm ios            # Run on iOS simulator
pnpm android        # Run on Android emulator
pnpm web            # Run web build
pnpm lint           # Expo ESLint
```

Supabase (requires Supabase CLI):
```bash
supabase start      # Start local stack
supabase db reset   # Recreate local DB from migrations
supabase migration new <name>
```

---

## 8. Consistency Checklist (read before editing UI)

- [ ] **No hardcoded colors.** No `#hex`, `rgb()`, `rgba()`, or named colors anywhere except `constants/colors.ts`. All colors come from `theme.colors.*` and use semantic names.
- [ ] **On-image content uses on-image tokens** (`onImage`, `onImageMuted`, `scrim`, `scrimStrong`, `backdrop`) — not raw `'#fff'` or `'rgba(0,0,0,...)'`.
- [ ] **Reusable component check.** Searched `components/ui/` and `components/property/` before adding new UI. Patterns repeated twice are extracted, not duplicated.
- [ ] All spacing uses `theme.spacing(n)` (no raw px for padding/margin/gap).
- [ ] All radii use `theme.radii.*`.
- [ ] All text styles spread `theme.typography.*`.
- [ ] All shadows spread `theme.shadows.*`.
- [ ] Stylesheet defined via `StyleSheet.create((theme) => ({...}))` from `react-native-unistyles`.
- [ ] Multi-state visuals use `variants` + `styles.useVariants(...)`, not chained ternaries.
- [ ] Reused UI patterns live in `components/ui/` or `components/<domain>/`, not duplicated in screens.
- [ ] No direct `supabase.auth.*` calls in screens — go through `useAuth()`.
- [ ] New tables include RLS policies in the same migration.
- [ ] If folder structure changed, the tree in **§2 Project Structure** was updated in this change.


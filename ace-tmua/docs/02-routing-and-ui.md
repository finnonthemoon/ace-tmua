# 2. React Native, routing, and UI

## React Native in plain English

React Native lets the project describe a user interface with React components
while producing real native iOS and Android views. JSX such as this is not HTML:

```tsx
<View>
  <Text>Start lesson</Text>
</View>
```

`View` becomes a native container and `Text` becomes native text. Styles are
JavaScript objects created with `StyleSheet.create`, not browser CSS. There is
no DOM, no `<div>`, and many browser layout assumptions do not apply.

Expo sits around React Native and supplies:

- a compatible set of native packages;
- development tooling and Metro, the JavaScript bundler;
- managed configuration in [`app.json`](../app.json);
- libraries for notifications, Apple authentication, linking, icons, and more;
- Expo Router for file-based navigation.

## Components, props, state, and effects

These four concepts explain most screen code.

### Component

A component is a function that returns a piece of UI. `ConceptScreenView`, for
example, returns the top bar, title, body, optional diagram, key point, and
continue button for one kind of lesson screen.

### Props

Props are inputs passed from a parent. The lesson player gives a concept screen
the content to display and callbacks for navigation:

```tsx
<ConceptScreenView
  screen={screen}
  progressPercent={progressPercent}
  onNext={next}
  onExit={onExit}
/>
```

The child does not need to know which lesson it belongs to. It only knows the
screen data and what to call when the user continues or exits.

### State

State is mutable UI memory. Calling its setter asks React to render again:

```tsx
const [screenIndex, setScreenIndex] = useState(0);
```

When `setScreenIndex(1)` runs, React calls the component again and the player
renders screen 1 instead of screen 0. State is temporary unless code also
persists it to AsyncStorage or a backend.

### Effect

An effect synchronises React with something outside rendering. Examples in
this app include:

- subscribing to Supabase authentication changes;
- starting and clearing a one-second timer;
- listening for notification taps;
- refreshing purchase status when the app returns to the foreground.

An effect should clean up listeners or timers when its component unmounts.

## How Expo Router turns files into routes

The `main` entry in [`package.json`](../package.json) is
`expo-router/entry`. Expo Router scans [`src/app`](../src/app), then turns its
file structure into navigation structure.

```text
src/app/
├── _layout.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── learn.tsx
│   ├── leaderboard.tsx
│   ├── questions.tsx
│   └── profile.tsx
├── lesson/
│   └── [lessonId].tsx
└── practice/
    ├── _layout.tsx
    └── [testId]/
        ├── instructions.tsx
        ├── test.tsx
        └── results.tsx
```

Square brackets mean a dynamic segment. The route
`/lesson/indices-surds-polynomials-1` is handled by `[lessonId].tsx`, with
`lessonId` equal to `indices-surds-polynomials-1`.

Code navigates to it with an explicit route and parameters:

```tsx
router.push({
  pathname: "/lesson/[lessonId]",
  params: { lessonId: lesson.id },
});
```

Typed routes are enabled in `app.json`, so TypeScript can catch many invalid
route names.

## The root layout

[`src/app/_layout.tsx`](../src/app/_layout.tsx) has three jobs.

### 1. Install global account state

```tsx
export default function RootLayout() {
  return (
    <AccountProvider>
      <RootNavigator />
    </AccountProvider>
  );
}
```

Because every route is inside `AccountProvider`, any descendant can call
`useAccount()` to read the current profile, session, sync status, and Premium
state or run account actions.

### 2. Guard onboarding

`RootNavigator` waits until the provider has loaded the saved profile. It then
checks the first route segment and `profile.onboardingCompleted`:

- an unfinished user is redirected to `/onboarding`;
- a finished user who manually reaches onboarding is redirected to `/`;
- sign-in, auth callback, and password reset remain public exceptions.

This is a **client-side navigation guard**, not a security boundary. It
controls user flow. Supabase Row Level Security controls actual database
security.

### 3. Separate the native tabs from full-screen routes

The root uses a `Stack`. Its first screen is the `(tabs)` route group, while
lessons, practice, onboarding, Premium, and authentication are separate stack
screens. This keeps the tab bar off full-screen flows without manually hiding
it.

[`src/app/(tabs)/_layout.tsx`](../src/app/(tabs)/_layout.tsx) declares Home,
Learn, Leaderboard, Questions, and Profile with Expo Router's `NativeTabs`.
These are real `UITabBarController`/Android tab-bar views rather than a custom
React Native rectangle. On an iOS 26 build produced by Xcode 26 or later, iOS
therefore supplies its native Liquid Glass material, selection animation, and
refraction. Older operating systems and Android display their standard native
tab bars.

The `(tabs)` folder is a **route group**: its name organises navigation but is
not included in the URL. For example, `(tabs)/learn.tsx` is still `/learn`.
[`src/components/app-tabs.tsx`](../src/components/app-tabs.tsx) is an older
starter implementation and is not the active navigation bar.

## Layouts nest

The root layout uses a stack containing the tab group. The nested
[`src/app/practice/_layout.tsx`](../src/app/practice/_layout.tsx) uses another
stack for the practice flow. Conceptually:

```text
Root stack
├── Native tab group
└── Practice route
    └── Practice stack
        ├── Instructions
        ├── Test
        └── Results
```

This allows practice screens to replace one another in a controlled sequence
without displaying the main bottom navigation during an exam attempt.

## How a route becomes real content

The lesson route is deliberately thin:

1. read `lessonId` from the URL;
2. find the matching object in `lessons.json`;
3. handle a missing ID;
4. pass the lesson to `LessonPlayer`;
5. navigate back when the player exits.

Thin route components are useful because business logic remains in reusable
components and services rather than becoming tied to a URL.

Practice routes follow the same idea. The route loads a definition by `testId`
and hands it to an instruction, runner, or result component.

## How the Home screen works

[`src/app/(tabs)/index.tsx`](../src/app/(tabs)/index.tsx) mainly renders cards. The calculations
are in [`src/components/home/home-data.ts`](../src/components/home/home-data.ts).
When Home gains focus it loads:

- completed lesson IDs;
- lesson activity events;
- practice results;
- unfinished practice sessions.

It then derives:

- the next unlocked lesson;
- progress for each of eight topics;
- the latest and best practice results;
- daily and weekly study minutes;
- a streak from distinct activity dates;
- the weakest scored practice topic;
- a resume action if a practice attempt is active.

This is **derived state**: it can be recalculated from saved records and does
not need another independent database field that might become inconsistent.

## The Learn roadmap

[`src/app/(tabs)/learn.tsx`](../src/app/(tabs)/learn.tsx) reads the same lesson JSON and a list
of completed lesson IDs. Within each topic:

- the first populated lesson is available;
- each later lesson unlocks when its predecessor is complete;
- a completed lesson remains available for review;
- a lesson with no screens is treated as unavailable.

The lock is a product/UI rule. It is not a backend permission. Someone changing
local storage could bypass it, which is acceptable for an educational sequence
but would not be acceptable for protecting paid access. Paid practice checks
the RevenueCat-derived `isPremium` value in more than one route.

## Navigation patterns used in the app

| Method | Meaning | Example use |
| --- | --- | --- |
| `router.push(...)` | Add a screen to history | Open a lesson or Premium |
| `router.replace(...)` | Replace the current screen | Onboarding guard, submit practice |
| `router.back()` | Return to previous history entry | Close Premium or an editor |
| Route params | Identify dynamic content | `lessonId`, `testId`, `attemptId` |
| `useFocusEffect` | Reload when a screen becomes active | Home, Questions, Profile |

`replace` is important in one-way flows. After submitting a test, the runner is
replaced with results so the Back button cannot accidentally reopen a finished
session.

## Styling and safe areas

React Native styles are objects. Shared colours and shadows live in
[`src/constants/theme.ts`](../src/constants/theme.ts), while lesson-specific
tokens are in [`src/components/lesson/shared.ts`](../src/components/lesson/shared.ts).

Most top-level screens use `SafeAreaView`. This keeps content away from the
iPhone notch, Dynamic Island, home indicator, and similar Android system
areas. Scroll views normally include extra bottom padding so cards do not sit
behind the floating tab bar.

## A practical way to find UI code

When looking at something on screen:

1. identify the route from the tab or URL;
2. open the matching file under `src/app`;
3. look at its imported components;
4. locate the visible text to confirm the component;
5. trace event handlers such as `onPress` to see what changes;
6. trace imported service functions when the handler saves or fetches data.

This approach is faster than reading the repository file by file.

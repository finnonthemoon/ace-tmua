# 11. Glossary

## Application and UI terms

**App process**  
The running instance of the app. React state disappears when this process is
terminated unless it was persisted.

**Build**  
The compiled, signed native application containing React Native, native modules,
assets, configuration, and JavaScript. A code repository is source; a build is
what can be installed.

**Component**  
A React function that returns UI. Components can receive props and hold state.

**Context**  
A React mechanism for providing shared values/actions to many descendants
without passing props through every intermediate component. `AccountContext` is
the main example.

**Development build**  
A custom native build of this project containing its exact native dependencies,
with developer tooling and a connection to Metro.

**Effect (`useEffect`)**  
Code that synchronises a component with an external system, such as a timer,
listener, network SDK, or navigation reaction.

**Expo**  
The toolchain and SDK around React Native used for development, configuration,
compatible native modules, and builds.

**Expo Go**  
A generic prebuilt Expo client that can load JavaScript projects but only has
the native modules included by Expo Go.

**Expo Router**  
The file-based navigation system. Files in `src/app` become routes.

**Hook**  
A React function beginning with `use`, such as `useState`, `useEffect`,
`useRouter`, or this app's `useAccount`.

**JSX/TSX**  
Syntax that lets TypeScript describe a tree of components using tags. TSX is
compiled to ordinary JavaScript calls.

**Metro**  
React Native's JavaScript bundler/development server. It resolves imports and
sends the app's JavaScript during development.

**Native module**  
Platform-specific code compiled into the iOS/Android app and exposed to
JavaScript. RevenueCat and Apple authentication include native modules.

**Props**  
Read-only inputs given to a component by its parent.

**React Native**  
React rendering to native iOS/Android views rather than browser DOM elements.

**Ref (`useRef`)**  
A mutable object whose `.current` persists across renders without causing a
render when changed. Useful for latest asynchronous values and guard flags.

**Render**  
React calling a component to calculate what UI should currently exist.

**Route**  
A navigable screen location, such as `/profile` or
`/practice/premium-paper-1/test`.

**Safe area**  
Screen insets that prevent content from colliding with notches, system bars,
home indicators, and rounded device edges.

**State**  
Data that can change and cause a React component to rerender.

## TypeScript and data terms

**Callback**  
A function passed somewhere to be called later, such as an `onPress` handler or
completion function.

**Discriminated union**  
A TypeScript union whose members have a distinguishing literal field. Lesson
screens use `type` so TypeScript can determine their other fields.

**Derived state/data**  
A value calculated from other records rather than independently stored, such as
course progress percentage or current streak.

**Idempotent**  
Safe to repeat without creating a different result. Upserting one activity by
stable event ID avoids duplicate rows on retry.

**Interface**  
A TypeScript description of an object's expected fields and types.

**ISO timestamp**  
A standard date-time string such as `2026-07-20T12:34:56.000Z`, useful for
storage, comparison, and transport.

**JSON**  
A text format for objects and arrays. ACE TMUA uses it for lessons, questions,
test definitions, and stored payloads.

**Promise / `async` / `await`**  
A Promise represents a future asynchronous result. An `async` function returns
a Promise; `await` pauses that function until it settles without blocking the
whole app thread.

**Source of truth**  
The system considered authoritative for a particular fact. RevenueCat customer
info is the immediate source for Premium; AsyncStorage is the device copy of
progress.

**Stable ID**  
An identifier that should continue referring to the same logical entity across
versions and sync retries.

**Upsert**  
Insert a row if it does not exist, otherwise update it based on a conflict key.

## Storage, backend, and security terms

**API**  
An interface one software system exposes to another. Supabase's client calls its
Auth and database APIs; Edge Functions call RevenueCat/Apple APIs.

**AsyncStorage**  
React Native key-value persistence used for local profiles, progress, attempts,
results, and notification IDs.

**Authentication (AuthN)**  
Proving who the user is, producing a session and stable user UUID.

**Authorisation (AuthZ)**  
Deciding what an authenticated identity may access or do.

**Bearer token**  
A token sent in an HTTP `Authorization: Bearer ...` header. Possession grants
the represented access, so tokens must not be logged or exposed.

**Client**  
The app running on the user's device. It must be treated as untrusted from a
backend security perspective.

**Cloud sync**  
Moving/merging local data with remote data so it can survive device changes.

**Database constraint**  
A server rule such as a primary key, foreign key, check, or non-null condition
that rejects invalid rows.

**Deep link / custom scheme**  
A URL that opens a particular app route. ACE TMUA uses the `acetmua://` scheme
for auth callbacks and password reset.

**Edge Function**  
Server-side TypeScript running on Supabase infrastructure. It can safely use
private credentials if it verifies incoming requests.

**Foreign key**  
A database reference from one table to a key in another. App rows reference the
Auth user UUID.

**JWT (JSON Web Token)**  
A signed token containing identity claims. Supabase uses the session JWT so RLS
can obtain `auth.uid()`.

**Local-first**  
An architecture in which the device saves/responds immediately and cloud sync
is an additional resilience/cross-device layer.

**Migration**  
An ordered, version-controlled database change applied to move a schema from
one version to another.

**OAuth**  
A standard delegated sign-in flow used for Google. The app receives a session
without handling the user's Google password.

**Postgres**  
The relational database used by Supabase.

**Publishable key**  
A client key designed to be distributed. It identifies the Supabase project;
RLS provides user data security.

**Row Level Security (RLS)**  
Postgres policies that decide which rows the current authenticated identity may
select, insert, update, or delete.

**Service-role key**  
A private Supabase server credential with elevated/bypass access. It must never
be shipped in the mobile app.

**Session**  
The authenticated state containing a user and tokens. Supabase persists and
refreshes it on the device.

**Trigger**  
A database function automatically run in response to an insert/update/delete.

**Webhook**  
An HTTP request one service sends to another when something changes. RevenueCat
sends purchase events to the Supabase Edge Function.

## Purchase terms

**App User ID**  
RevenueCat's identifier for a customer. ACE TMUA uses the Supabase UUID for
signed-in users.

**CustomerInfo**  
RevenueCat's current customer object containing active entitlements and other
purchase details.

**Entitlement**  
A named access right. Products grant `AceTMUA Pro`; app code checks the
entitlement rather than individual product IDs.

**Offering**  
The collection of packages RevenueCat currently presents to a user.

**Package**  
A RevenueCat presentation slot such as monthly or annual that points to a store
product.

**Paywall**  
The screen that explains Premium and offers store-backed packages.

**Product**  
The actual subscription/in-app purchase configured in App Store Connect or
Google Play Console.

**Restore purchases**  
Ask the store/RevenueCat to recover purchases for the current store account.

## Maths and content terms

**Blueprint**  
A practice-paper recipe specifying how many questions to select by topic and
difficulty.

**LaTeX**  
The text notation authors use for mathematics, such as `x^{3/2}` or
`\frac{a}{b}`.

**MathJax**  
The engine used by the current renderer to turn LaTeX into visual mathematical
output.

**SVG**  
Scalable Vector Graphics. MathJax expressions and hand-built lesson diagrams
use vector paths/shapes that remain sharp at different sizes.

**Zero-based index**  
Counting starting at 0. Practice `answerIndex: 0` means option A.

# ACE TMUA engineering handbook

This handbook explains how the app works as a system. You do not need to
memorise every line of syntax. The goal is to understand the responsibilities
of each part, how data moves between them, and why the important design choices
were made.

Read the chapters in order the first time. Keep the repository open beside the
documentation and follow the links to the real files whenever you want to see
the full implementation.

## Reading order

1. [System overview](01-system-overview.md) — the mental model and architecture.
2. [React Native, routing, and UI](02-routing-and-ui.md) — how the app starts and changes screens.
3. [State, storage, and synchronisation](03-state-storage-and-sync.md) — where data lives and how it moves.
4. [Onboarding, authentication, and accounts](04-onboarding-auth-and-accounts.md) — guests, email, Google, Apple, and deletion.
5. [Lessons and mathematical rendering](05-lessons-and-maths.md) — JSON content, the lesson state machine, MathJax, and diagrams.
6. [Practice-paper engine](06-practice-engine.md) — question selection, timers, saved attempts, marking, and results.
7. [Supabase backend and security](07-supabase-and-security.md) — tables, triggers, Row Level Security, and Edge Functions.
8. [Premium, RevenueCat, and notifications](08-premium-and-notifications.md) — purchases, entitlements, reminders, and identities.
9. [Testing, debugging, and release](09-testing-debugging-and-release.md) — checks, environment setup, common failures, and current gaps.
10. [Interview guide](10-interview-guide.md) — concise explanations, likely questions, trade-offs, and an honest AI-assisted-development answer.
11. [Glossary](11-glossary.md) — plain-English definitions of the terminology used throughout.

## How to learn from these documents

For each chapter:

1. Read the explanation once without opening code.
2. Follow the linked files and locate the small snippets shown in the chapter.
3. Pick one user action—such as completing a lesson—and narrate what happens
   from the button press to local storage and Supabase.
4. Change one harmless detail on a branch, such as button text, and trace which
   file was responsible.
5. Re-explain the chapter aloud without looking at it. Anything you cannot
   explain becomes the next thing to revisit.

## The shortest possible description

ACE TMUA is a local-first Expo app. Expo Router maps files to screens. React
state controls what the user sees. JSON files provide lessons and practice
questions. AsyncStorage makes the app work immediately and offline. Supabase
provides authentication and cross-device backup. RevenueCat reads store
purchases and decides whether Premium is active. Supabase Edge Functions
perform the privileged server operations that must never run inside the app.

That paragraph is the core of the system. The rest of the handbook makes every
part of it concrete.

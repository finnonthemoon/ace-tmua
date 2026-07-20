# ACE TMUA

ACE TMUA is an Expo/React Native study app for the Test of Mathematics for
University Admission. It combines a structured lesson pathway, mathematical
rendering, timed practice papers, progress tracking, account synchronisation,
and a RevenueCat-powered Premium tier.

This repository contains the mobile app, its JSON lesson and question content,
the Supabase database schema and Edge Functions, and the scripts used to check
the content and connected services.

## Understand the system

The best place to begin is the [ACE TMUA engineering handbook](docs/README.md).
It is written as a start-to-finish explanation for someone who knows basic
programming but does not yet know this codebase. It covers:

- how Expo, React Native, Expo Router, Supabase, and RevenueCat fit together;
- how screens, state, local storage, and cloud synchronisation work;
- the lesson runner, mathematical renderer, and practice-paper engine;
- authentication, subscriptions, notifications, and account deletion;
- testing, debugging, common changes, and interview questions.

## Start the project

```bash
npm install
npm start
```

The app reads service configuration from `.env.local`. See
[SUPABASE_SETUP.md](SUPABASE_SETUP.md) for backend setup and
[docs/09-testing-debugging-and-release.md](docs/09-testing-debugging-and-release.md)
for the full development and release checklist.

Useful checks:

```bash
npx tsc --noEmit
npm run lint
npm run validate:practice
npm run check:services
```

## Important directories

| Path | Purpose |
| --- | --- |
| `src/app` | File-based Expo Router screens and layouts |
| `src/components/lesson` | Lesson runner, screen types, maths, and diagrams |
| `src/components/practice` | Mock-paper selection, runner, storage, and results |
| `src/contexts` | App-wide account and Premium state |
| `src/services` | Authentication, storage, sync, cloud, and notification logic |
| `src/data` | Lessons, question bank, test definitions, and static data |
| `supabase` | Database schema, migrations, and server-side Edge Functions |
| `scripts` | Content and service validation tools |
| `docs` | The engineering handbook |

## Current status

The main learning, practice, profile, onboarding, authentication, local-first
storage, Supabase sync, RevenueCat, notifications, and deletion flows are
implemented. Some release configuration still depends on external dashboards
and store accounts. The leaderboard currently displays static demonstration
data rather than a production multiplayer service.

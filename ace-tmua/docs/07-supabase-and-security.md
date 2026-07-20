# 7. Supabase backend and security

## What Supabase provides

Supabase is used for three related but distinct backend capabilities:

1. **Auth** — users, provider identities, sessions, and password recovery.
2. **Postgres** — profiles, progress, activity, practice, and entitlement rows.
3. **Edge Functions** — trusted server code for RevenueCat webhooks and account
   deletion.

The schema source is [`supabase/schema.sql`](../supabase/schema.sql). The app
uses [`src/lib/supabase.ts`](../src/lib/supabase.ts) to create a mobile client.

## Database tables

| Table | Primary identity | Purpose |
| --- | --- | --- |
| `profiles` | `id` = Auth user UUID | Name, goal, schedule, onboarding |
| `entitlements` | `user_id` | Server copy of Premium product/expiry |
| `lesson_progress` | `(user_id, lesson_id)` | Rolled-up lesson totals |
| `study_activities` | `(user_id, client_event_id)` | Individual lesson/practice events |
| `practice_results` | `(user_id, result_id)` | Scored attempts plus JSON payload |
| `practice_sessions` | `(user_id, test_id)` | One resumable attempt per test |

Every user-owned table includes the Supabase Auth UUID. This enables both
foreign-key cleanup and Row Level Security.

## Foreign keys and cascade deletion

Rows reference `auth.users(id) on delete cascade`. When the server deletes an
Auth user, Postgres automatically deletes dependent rows.

This is safer than asking the phone to remember every table. It also makes
account deletion atomic from the database's perspective: after the Auth delete,
orphaned user records should not remain in these tables.

External systems such as RevenueCat and Apple are not database tables, so the
Edge Function handles them separately before deleting the Auth user.

## New-user trigger

`handle_new_user()` runs after an Auth user is inserted. It creates:

- a `profiles` row from validated Auth metadata;
- a default free `entitlements` row.

The function checks target score, exam sitting, days, and study-time formats
instead of blindly trusting metadata sent by a client.

It is `security definer`, meaning it executes with the function owner's
privileges. Its fixed `search_path` reduces the risk of object-name hijacking.

## Lesson roll-up trigger

The app writes individual lesson events to `study_activities`. The
`roll_up_lesson_activity()` trigger maintains one summary row per lesson with:

- most recent completion;
- best correct and total counts;
- number of sessions;
- accumulated seconds.

This demonstrates two useful data shapes:

- an append-like event history for detailed analytics;
- a compact aggregate for efficient progress queries.

The trigger means every trusted insertion path gets the same aggregation logic,
not only the current mobile client.

## Row Level Security (RLS)

A Supabase publishable key is not a secret. Security comes from Postgres RLS
and the JWT attached to an authenticated request.

For example, the profile select policy is equivalent to:

```sql
using ((select auth.uid()) = id)
```

The JWT identifies the current Auth UUID. A user can only read the profile
whose `id` matches it.

Progress policies compare `auth.uid()` with `user_id` for both existing rows
(`using`) and inserted/updated rows (`with check`). Therefore changing a JSON
request in a debugger should not let one student read or write another
student's rows.

RLS is enabled on all six app tables. Entitlements deliberately have a read
policy but no client insert/update policy, because subscription truth should be
written only by the trusted webhook.

## Public and private keys

| Value | May be in mobile `.env`? | Reason |
| --- | --- | --- |
| Supabase URL | Yes | Public project endpoint |
| Supabase publishable key | Yes | RLS constrains it |
| RevenueCat public platform SDK key | Yes | Identifies app/project to SDK |
| RevenueCat Test Store public key | Development only | Must not ship in release |
| Supabase service-role key | No | Bypasses RLS/admin access |
| RevenueCat secret API key | No | Reads/changes customer server data |
| RevenueCat webhook authorisation secret | No | Authenticates webhook sender |
| Apple private `.p8` key | No | Signs Apple client secrets |
| Google OAuth client secret | No | Server/provider configuration |

Any variable prefixed `EXPO_PUBLIC_` is bundled into the client and should be
treated as public.

## Mobile client behaviour

The Supabase client is configured with persistent sessions and AsyncStorage.
Calls in [`cloud-api.ts`](../src/services/cloud-api.ts) remain user-scoped even
when they also include `.eq("user_id", userId)`. The filter is useful for
clarity/performance; RLS is what enforces the boundary.

The client never imports the service-role key and cannot call
`auth.admin.deleteUser` directly.

## RevenueCat webhook function

[`supabase/functions/revenuecat-webhook/index.ts`](../supabase/functions/revenuecat-webhook/index.ts)
runs when RevenueCat sends an event.

Its flow is:

1. accept POST only;
2. compare the `Authorization` header with a server secret;
3. find a UUID among RevenueCat's app user ID/original ID/aliases;
4. ignore anonymous test/dashboard events that do not map to Supabase;
5. fetch the complete current subscriber from RevenueCat's API;
6. inspect the configured entitlement and expiry;
7. use the Supabase service role to upsert `entitlements`.

Why fetch the full subscriber rather than infer state from the event type?
Purchases, renewals, cancellations, expirations, refunds, transfers, and aliases
can arrive in different sequences. Re-reading current state makes the handler
convergent and easier to reason about.

The webhook supplies a **server-side mirror**. The mobile SDK still checks
RevenueCat directly for immediate UI access.

## Delete-account function

[`supabase/functions/delete-account/index.ts`](../supabase/functions/delete-account/index.ts)
is a privileged endpoint.

Security and integrity steps include:

- POST-only and explicit `confirmation === "DELETE"`;
- bearer token required;
- `admin.auth.getUser(token)` verifies and resolves the caller;
- the caller cannot supply a different user ID;
- RevenueCat customer deletion uses a private V2 API key;
- optional Apple code exchange verifies the identity-token subject;
- only then does service-role code delete the current Auth user.

Apple revocation creates a short-lived client secret signed from Apple team,
key, client ID, and private-key secrets. Those values belong in the function
environment, never source control.

## Why the Edge Functions need a service role

Normal RLS intentionally does not allow a user to:

- update `entitlements`;
- delete an Auth record using admin APIs;
- use RevenueCat private customer APIs.

An Edge Function holds elevated credentials, but must first authenticate its
input. The safe pattern is:

```text
untrusted request -> verify token/secret -> derive identity server-side -> privileged action
```

The unsafe pattern would be accepting `{ userId: "..." }` from the app and
deleting it with service-role access.

## Database setup is versioned infrastructure

The schema file can initialise an MVP project. As the live database evolves,
changes should be captured as ordered migrations in
[`supabase/migrations`](../supabase/migrations), reviewed like application code,
and tested against a non-production project first.

Application code and database schema must agree about:

- table/column names;
- constraints;
- allowed enum-like strings;
- payload structure;
- policies and grants;
- trigger behaviour.

## Verifying security

`npm run check:services` performs several useful external checks:

- Supabase Auth health/settings;
- expected tables are reachable;
- an anonymous profile insert is rejected by RLS;
- RevenueCat accepts the configured SDK key;
- a current offering and packages exist.

It does not prove every signed-in policy, webhook secret, Apple revocation, or
account-deletion path. Those need dedicated test users and end-to-end checks in
a staging environment.

## Useful interview explanation

“The publishable Supabase key is intentionally public; Postgres RLS scopes every
client query to `auth.uid()`. New-user and lesson-roll-up triggers keep server
invariants consistent. Entitlements are client-readable but only server-writable.
RevenueCat webhooks and account deletion run as Edge Functions because they
need secret credentials; each function authenticates the request and derives
the user server-side before using service-role access.”

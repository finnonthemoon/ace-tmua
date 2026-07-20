# Account-deletion Edge Function

This authenticated function permanently removes the calling user. It:

1. validates the caller's Supabase access token;
2. requires the literal confirmation value `DELETE`;
3. removes the RevenueCat customer when the server integration is configured;
4. revokes a freshly issued Sign in with Apple token when possible; and
5. hard-deletes the Supabase Auth user, triggering the existing foreign-key cascades.

Never put any of the secrets below in an Expo environment variable or in the
mobile app.

## Deploy

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy delete-account
```

JWT verification must remain enabled for this function. The app invokes it
with the signed-in user's access token.

## RevenueCat erasure

Create a RevenueCat **V2 secret API key** with
`customer_information:customers:read_write`, then configure:

```bash
npx supabase secrets set \
  REVENUECAT_PROJECT_ID=proj_YOUR_PROJECT_ID \
  REVENUECAT_V2_SECRET_API_KEY=sk_YOUR_V2_SECRET_KEY
```

Both values are required. The function refuses to partially delete an account
when RevenueCat erasure is not configured or fails. Deleting a RevenueCat
customer does not cancel an App Store or Google Play subscription; the app
directs the user to subscription management before deletion.

## Sign in with Apple revocation

Once the paid Apple Developer account and production App ID exist, create a
Sign in with Apple key and configure:

```bash
npx supabase secrets set \
  APPLE_TEAM_ID=YOUR_TEAM_ID \
  APPLE_KEY_ID=YOUR_KEY_ID \
  APPLE_CLIENT_ID=com.yourcompany.acetmua \
  APPLE_PRIVATE_KEY="$(cat AuthKey_YOUR_KEY_ID.p8)"
```

`APPLE_CLIENT_ID` must be the native App ID/bundle identifier used by the
Apple authorization code. The private key remains only in Supabase secrets.

For an Apple-linked account, the app requests a fresh authorization code. The
function exchanges it server-side, verifies that the returned Apple subject
matches the Supabase identity, and calls Apple's token revocation endpoint. If
Apple cannot provide or revoke a token, account and data deletion still
proceeds and the response tells the app to show manual revocation instructions.

## Required tests before release

- Email/password account: create data, delete, verify Auth user and all six
  user tables are empty for the UUID.
- Google account: repeat the same test and confirm the OAuth flow does not
  prevent deletion.
- Apple account on a physical signed iPhone: confirm the Apple sheet appears,
  deletion completes, and a subsequent Apple sign-in starts a fresh account.
- Active subscription: open subscription management, return to the app,
  delete immediately, and confirm billing was not represented as cancelled.
- RevenueCat: confirm the Supabase UUID customer has been removed or deletion
  has been queued.

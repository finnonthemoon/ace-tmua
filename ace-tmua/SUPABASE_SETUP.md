# Connecting ACE TMUA to Supabase

The app works immediately in guest mode. When Supabase is configured it adds email, Google and Apple authentication plus cloud profile and progress syncing.

## 1. Add the database tables

1. Open the Supabase project dashboard.
2. Open **SQL Editor**.
3. Create a new query.
4. Copy everything from `supabase/schema.sql` into the editor.
5. Select **Run**.

The script creates profiles, lesson progress, study activity, practice results, saved practice sessions and a protected Premium entitlement table. Row Level Security ensures signed-in users can only access their own rows.

## 2. Add the project keys

1. In Supabase, open the project's **Connect** panel.
2. Copy the **Project URL**.
3. Copy the **Publishable key**. Older projects may call this the anon key.
4. Duplicate `.env.example` and name the copy `.env`.
5. Replace the two placeholder values:

```text
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Never put the Supabase service-role key in the app. The publishable key is designed to be used by client apps together with Row Level Security.

Restart Expo after changing `.env`:

```powershell
npx expo start --clear
```

## 3. Configure email authentication

1. Open **Authentication → Providers → Email** in Supabase.
2. Ensure Email is enabled.
3. For quick development testing, either disable email confirmation temporarily or configure the callback first.
4. Open **Authentication → URL Configuration**.
5. Add this Redirect URL:

```text
acetmua://auth/callback
acetmua://reset-password
```

For production, keep email confirmation enabled and customise the confirmation email template and sender.

Email/password registration now works from onboarding and Profile. Confirmation links are handled by `src/app/auth/callback.tsx`, while password recovery is handled by `src/app/reset-password.tsx`.

## 4. Configure Google

This part must be completed in Google Cloud and the Supabase dashboard; it cannot be generated safely in the app.

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview).
2. Create/configure the OAuth consent screen with the app name, support email and logo.
3. Add the `openid`, email and profile scopes.
4. Create an OAuth Client ID with application type **Web application**.
5. In the Google client's **Authorized redirect URIs**, add the callback URL displayed on the Supabase Google provider page. It normally has this form:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

6. Copy the Google Client ID and Client Secret.
7. In Supabase open **Authentication → Providers → Google**.
8. Enable Google and paste the Client ID and Client Secret.
9. Keep `acetmua://auth/callback` in the Supabase redirect allow list.

The Google Client Secret belongs only in Supabase, never in `.env` or the React Native app.

Google OAuth is most reliable in an iOS development/TestFlight build because it has the stable `acetmua://` scheme. Expo Go uses a changing development URL, which would also need to be allow-listed for each environment.

## 5. Configure Sign in with Apple

The code and Expo config are present, but a real standalone build needs an Apple Developer membership and an app identifier owned by the team.

1. Choose the final iOS bundle identifier. Replace `com.anonymous.ace-tmua` in `app.json` before creating App Store records.
2. In the [Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list), create or update the App ID for that bundle identifier.
3. Enable the **Sign in with Apple** capability on the App ID.
4. In Supabase open **Authentication → Providers → Apple** and enable Apple.
5. Add the native iOS bundle identifier to the Apple provider's accepted Client IDs.
6. If a web or Android Apple OAuth flow is added later, create a Services ID and Apple signing key as well. Apple OAuth secrets must be regenerated periodically; the current native iOS flow avoids that web-only maintenance requirement.
7. Create a new native development build after changing capabilities:

Expo Doctor currently reports that CocoaPods is not installed on this Mac. Install CocoaPods before making a local iOS build:

```text
sudo gem install cocoapods
pod --version
```

Then generate and run the native project:

```text
npx expo prebuild
npx expo run:ios --device
```

Expo Go can test the Apple UI, but identifiers differ from the standalone app. Final verification must happen on a physical iPhone using your own signed build.

## 6. Test cloud syncing

1. Complete a lesson as a guest.
2. Open Profile and create an account.
3. Confirm the email if confirmation is enabled.
4. In Supabase **Table Editor**, confirm rows appear in `profiles`, `lesson_progress` and `study_activities`.
5. Complete a practice set and confirm a row appears in `practice_results`.
6. Sign into the same account on another build/device and check that the lesson and practice result return.

If the database schema has not been installed or the device is offline, the app retains local progress and shows a sync warning instead of discarding data.

## 7. Add RevenueCat later

Premium is intentionally not granted by client-side code. Users can record interest, while premium practice routes check the cached entitlement.

When RevenueCat is introduced:

1. Create the App Store products and RevenueCat entitlement.
2. Add the RevenueCat React Native SDK.
3. Replace the placeholder Premium action with the RevenueCat paywall/purchase call.
4. Use a trusted RevenueCat webhook or Supabase Edge Function to update `public.entitlements` with the service role.
5. Refresh the account after a purchase or restore.

Do not add an INSERT or UPDATE client policy to `entitlements`; otherwise users could grant Premium to themselves.

## Still required before App Store release

- Final Apple bundle identifier and Apple Developer/App Store Connect setup.
- Google OAuth consent configuration and production branding verification.
- RevenueCat products, pricing, paywall and restore-purchases flow.
- Privacy Policy and Terms URLs.
- An in-app account-deletion flow backed by a secure Supabase Edge Function.
- TestFlight testing of email links, Google OAuth and Apple authentication on physical devices.

Official references:

- [Supabase Expo React Native quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [Supabase React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Apple login](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Expo Apple Authentication](https://docs.expo.dev/versions/v57.0.0/sdk/apple-authentication/)
- [Expo AuthSession](https://docs.expo.dev/versions/v57.0.0/sdk/auth-session/)
- [CocoaPods installation](https://guides.cocoapods.org/using/getting-started.html)

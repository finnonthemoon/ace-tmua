# RevenueCat entitlement webhook

This Edge Function keeps `public.entitlements` in sync without allowing the mobile client to write Premium access.

## Deploy

1. Install and sign in to the Supabase CLI.
2. Link this folder to the production Supabase project.
3. Generate a long random webhook authorization value.
4. Add these Edge Function secrets:

```text
REVENUECAT_WEBHOOK_AUTHORIZATION=Bearer YOUR_LONG_RANDOM_VALUE
REVENUECAT_SECRET_API_KEY=sk_YOUR_REVENUECAT_SECRET_KEY
REVENUECAT_ENTITLEMENT_ID=AceTMUA Pro
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically inside a deployed Supabase Edge Function.

Deploy the function:

```text
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

## RevenueCat dashboard

Create a RevenueCat webhook integration pointing to:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook
```

Set its Authorization header to exactly the same `Bearer YOUR_LONG_RANDOM_VALUE` stored in the Supabase secret. Send sandbox and production subscription lifecycle events. Then issue a dashboard test event and inspect the Edge Function logs.

Never add the RevenueCat secret API key or Supabase service-role key to an `EXPO_PUBLIC_` variable.

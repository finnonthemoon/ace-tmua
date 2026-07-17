import { createClient } from "npm:@supabase/supabase-js@2";

interface RevenueCatWebhookBody {
  event?: {
    app_user_id?: string;
    original_app_user_id?: string;
    aliases?: string[];
  };
}

interface RevenueCatEntitlement {
  expires_date?: string | null;
  product_identifier?: string | null;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const expectedAuthorization = Deno.env.get(
    "REVENUECAT_WEBHOOK_AUTHORIZATION",
  );
  if (
    !expectedAuthorization ||
    request.headers.get("authorization") !== expectedAuthorization
  ) {
    return json(401, { error: "Invalid webhook authorization" });
  }

  const revenueCatSecretKey = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const entitlementId =
    Deno.env.get("REVENUECAT_ENTITLEMENT_ID") || "AceTMUA Pro";

  if (!revenueCatSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
    return json(500, { error: "Server secrets are incomplete" });
  }

  let body: RevenueCatWebhookBody;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const event = body.event;
  if (!event) return json(400, { error: "Webhook event is missing" });

  const userId = [
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
  ].find((candidate): candidate is string =>
    Boolean(candidate && uuidPattern.test(candidate)),
  );

  // Anonymous Test Store users and dashboard test events do not map to an
  // authenticated Supabase account, so there is no database row to update.
  if (!userId) {
    return json(200, { synced: false, reason: "No Supabase user ID" });
  }

  // RevenueCat recommends re-reading the full subscriber after every webhook
  // instead of trying to infer current access from individual event types.
  const subscriberResponse = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${revenueCatSecretKey}`,
      },
    },
  );

  if (!subscriberResponse.ok) {
    return json(502, {
      error: "RevenueCat subscriber lookup failed",
      status: subscriberResponse.status,
    });
  }

  const subscriberBody = await subscriberResponse.json();
  const entitlement = subscriberBody?.subscriber?.entitlements?.[
    entitlementId
  ] as RevenueCatEntitlement | undefined;
  const expiresAt = entitlement?.expires_date ?? null;
  const premium = Boolean(
    entitlement &&
      (!expiresAt || new Date(expiresAt).getTime() > Date.now()),
  );

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.from("entitlements").upsert(
    {
      user_id: userId,
      premium,
      product_id: entitlement?.product_identifier ?? null,
      expires_at: expiresAt,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return json(500, { error: "Entitlement database update failed" });
  }

  return json(200, { synced: true, premium });
});

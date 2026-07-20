import { createClient } from "npm:@supabase/supabase-js@2";
import { decodeJwt, importPKCS8, SignJWT } from "npm:jose@6";

interface DeleteAccountBody {
  confirmation?: string;
  appleAuthorizationCode?: string;
}

type AppleRevocationStatus =
  | "not-applicable"
  | "revoked"
  | "manual-required";

type RevenueCatDeletionStatus =
  | "deleted"
  | "not-found"
  | "queued";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function appleIdentityDetails(
  identities:
    | Array<{
        provider?: string;
        identity_data?: Record<string, unknown>;
      }>
    | undefined,
) {
  const identity = identities?.find((item) => item.provider === "apple");
  const subject = identity?.identity_data?.sub;
  return {
    exists: Boolean(identity),
    subject: typeof subject === "string" ? subject : null,
  };
}

async function createAppleClientSecret() {
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const clientId = Deno.env.get("APPLE_CLIENT_ID");
  const privateKeyValue = Deno.env.get("APPLE_PRIVATE_KEY");

  if (!teamId || !keyId || !clientId || !privateKeyValue) return null;

  const privateKey = await importPKCS8(
    privateKeyValue.replace(/\\n/g, "\n"),
    "ES256",
  );
  const clientSecret = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

  return { clientId, clientSecret };
}

async function revokeAppleAuthorizationCode(
  authorizationCode: string | undefined,
  expectedSubject: string | null,
): Promise<AppleRevocationStatus> {
  if (!authorizationCode) return "manual-required";

  const credentials = await createAppleClientSecret();
  if (!credentials) return "manual-required";

  try {
    const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code: authorizationCode,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error(
        "Apple token exchange failed during account deletion:",
        tokenResponse.status,
      );
      return "manual-required";
    }

    const tokenBody = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
      refresh_token?: string;
    };

    if (expectedSubject && tokenBody.id_token) {
      const actualSubject = decodeJwt(tokenBody.id_token).sub;
      if (actualSubject !== expectedSubject) {
        console.error("Apple reauthentication did not match the current user.");
        return "manual-required";
      }
    }

    const token = tokenBody.refresh_token ?? tokenBody.access_token;
    const tokenTypeHint = tokenBody.refresh_token
      ? "refresh_token"
      : "access_token";
    if (!token) return "manual-required";

    const revokeResponse = await fetch(
      "https://appleid.apple.com/auth/revoke",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          token,
          token_type_hint: tokenTypeHint,
        }),
      },
    );

    if (!revokeResponse.ok) {
      console.error(
        "Apple token revocation failed during account deletion:",
        revokeResponse.status,
      );
      return "manual-required";
    }

    return "revoked";
  } catch (error) {
    console.error("Apple token revocation could not be completed:", error);
    return "manual-required";
  }
}

async function deleteRevenueCatCustomer(
  userId: string,
): Promise<RevenueCatDeletionStatus> {
  const projectId = Deno.env.get("REVENUECAT_PROJECT_ID");
  const apiKey = Deno.env.get("REVENUECAT_V2_SECRET_API_KEY");

  if (!projectId || !apiKey) {
    throw new Error("RevenueCat account-deletion secrets are not configured.");
  }

  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(projectId)}/customers/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (response.status === 404) return "not-found";
  if (response.status === 202) return "queued";
  if (response.ok) return "deleted";

  throw new Error(`RevenueCat customer deletion returned ${response.status}.`);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const token = bearerToken(request);
  if (!token) return json(401, { error: "Authentication is required" });

  let body: DeleteAccountBody;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (body.confirmation !== "DELETE") {
    return json(400, { error: "Account deletion was not confirmed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Server configuration is incomplete" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return json(401, { error: "Your session has expired. Sign in again." });
  }

  let revenueCatDeletion: RevenueCatDeletionStatus;
  try {
    revenueCatDeletion = await deleteRevenueCatCustomer(user.id);
  } catch (error) {
    console.error("RevenueCat customer deletion failed:", error);
    return json(502, {
      error: "Purchase data could not be removed. Please try again.",
    });
  }

  const appleIdentity = appleIdentityDetails(user.identities);
  const appleRevocation = appleIdentity.exists
    ? await revokeAppleAuthorizationCode(
        body.appleAuthorizationCode,
        appleIdentity.subject,
      )
    : "not-applicable";

  const { error: deletionError } = await admin.auth.admin.deleteUser(
    user.id,
    false,
  );
  if (deletionError) {
    console.error("Supabase account deletion failed:", deletionError);
    return json(500, {
      error: "The account could not be deleted. Please try again.",
    });
  }

  return json(200, {
    deleted: true,
    appleRevocation,
    revenueCatDeletion,
  });
});

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const failures = [];
const warnings = [];

function pass(message) {
  console.log(`PASS  ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL  ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN  ${message}`);
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function checkSupabase() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    fail("Supabase URL or publishable key is missing.");
    return;
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const health = await fetch(`${url}/auth/v1/health`, { headers });
  if (health.ok) pass("Supabase Auth is reachable.");
  else fail(`Supabase Auth health returned HTTP ${health.status}.`);

  const settingsResponse = await fetch(`${url}/auth/v1/settings`, { headers });
  const settings = await readJson(settingsResponse);
  if (!settingsResponse.ok) {
    fail(`Supabase Auth settings returned HTTP ${settingsResponse.status}.`);
  } else {
    pass("Supabase Auth settings are readable.");
    if (!settings?.external?.email) warn("Email authentication is disabled.");
    if (!settings?.external?.google) warn("Google authentication is disabled.");
    if (!settings?.external?.apple) warn("Apple authentication is disabled.");
  }

  const tables = [
    "profiles",
    "entitlements",
    "lesson_progress",
    "study_activities",
    "practice_results",
    "practice_sessions",
  ];

  const tableResults = await Promise.all(
    tables.map(async (table) => {
      const response = await fetch(
        `${url}/rest/v1/${table}?select=*&limit=1`,
        { headers },
      );
      return { table, response };
    }),
  );

  for (const { table, response } of tableResults) {
    if (response.ok) pass(`Database table ${table} is available.`);
    else fail(`Database table ${table} returned HTTP ${response.status}.`);
  }

  const rlsProbe = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: randomUUID(),
      display_name: "ACE TMUA service audit",
    }),
  });
  const rlsBody = await readJson(rlsProbe);
  if (
    (rlsProbe.status === 401 || rlsProbe.status === 403) &&
    rlsBody?.code === "42501"
  ) {
    pass("Row Level Security blocks anonymous profile writes.");
  } else {
    fail(
      `Anonymous profile write was not rejected by RLS as expected (HTTP ${rlsProbe.status}).`,
    );
  }
}

async function checkRevenueCat() {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  const apiKey = testKey || iosKey || androidKey;

  if (!apiKey) {
    fail("No RevenueCat public SDK key is configured.");
    return;
  }

  const subscriberId = "$RCAnonymousID:ace-tmua-service-audit";
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(subscriberId)}/offerings`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
  const body = await readJson(response);
  if (!response.ok) {
    fail(`RevenueCat offerings returned HTTP ${response.status}.`);
    return;
  }

  pass("RevenueCat accepted the configured SDK key.");
  const offerings = Array.isArray(body?.offerings) ? body.offerings : [];
  const current = offerings.find(
    (offering) => offering.identifier === body?.current_offering_id,
  );
  if (!current) {
    fail("RevenueCat has no current offering.");
    return;
  }

  pass(`RevenueCat current offering is ${current.identifier}.`);
  const packages = Array.isArray(current.packages) ? current.packages : [];
  if (!packages.length) {
    fail("RevenueCat current offering has no packages.");
  } else {
    pass(`RevenueCat current offering exposes ${packages.length} package(s).`);
    for (const item of packages) {
      console.log(
        `      ${item.identifier} -> ${item.platform_product_identifier}`,
      );
    }
  }

  if (testKey) pass("RevenueCat Test Store is configured for development.");
  if (!iosKey) warn("RevenueCat production iOS public SDK key is missing.");
  if (!androidKey) warn("RevenueCat production Android public SDK key is missing.");
  warn("A published RevenueCat paywall must be verified in a native development build.");
}

console.log("ACE TMUA service audit\n");

try {
  await checkSupabase();
} catch (error) {
  fail(`Supabase check crashed: ${error instanceof Error ? error.message : error}`);
}

console.log("");

try {
  await checkRevenueCat();
} catch (error) {
  fail(`RevenueCat check crashed: ${error instanceof Error ? error.message : error}`);
}

console.log(
  `\nResult: ${failures.length} failure(s), ${warnings.length} warning(s).`,
);
if (failures.length) process.exitCode = 1;

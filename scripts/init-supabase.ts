/**
 * Supabase initialization script.
 * Creates all tables, RLS policies, triggers and vector-search functions.
 *
 * Two modes:
 *   1. Management API  — requires SUPABASE_ACCESS_TOKEN (personal token) + project ref
 *   2. Manual          — prints the SQL and tells you to run it in the SQL Editor
 *
 * Usage:
 *   npx tsx scripts/init-supabase.ts
 *
 * Env vars used:
 *   NEXT_PUBLIC_SUPABASE_URL  — https://xxxx.supabase.co
 *   SUPABASE_ACCESS_TOKEN     — Supabase personal access token (optional)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "MISTRAL_API_KEY",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("Missing env vars in .env.local:");
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error("\nCopy .env.example to .env.local and fill in the values first.");
  process.exit(1);
}

async function runViaManagementApi(sql: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = url.replace("https://", "").split(".")[0];

  if (!token) {
    console.error(
      "SUPABASE_ACCESS_TOKEN not set. Run the script manually in the SQL Editor instead (see below)."
    );
    console.error(sql);
    process.exit(1);
  }

  console.log(`Executing SQL against project "${ref}"...`);

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Execution failed:", res.status, body.slice(0, 2000));
    process.exit(1);
  }

  console.log("Database initialized successfully.");
}

async function main() {
  const schemaPath = join(__dirname, "..", "supabase", "schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  console.log("Loaded", sql.split(";").length, "SQL statements from supabase/schema.sql");
  console.log("");

  await runViaManagementApi(sql);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

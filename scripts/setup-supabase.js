// ============================================
// Supabase Schema Setup Script
// Run: node scripts/setup-supabase.js
// ============================================

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE credentials in .env");
  process.exit(1);
}

// Extract project ref from URL
const ref = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
if (!ref) {
  console.error("Invalid SUPABASE_URL format");
  process.exit(1);
}

const pool = new Pool({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: SERVICE_KEY,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function main() {
  console.log(`Connecting to Supabase (${ref})...`);
  const client = await pool.connect();
  console.log("Connected!");

  try {
    // Read and execute schema
    const sqlPath = path.join(__dirname, "..", "src", "lib", "db", "schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("Executing schema...");
    await client.query(sql);
    console.log("✅ Schema executed successfully!");

    // Verify tables
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );
    console.log(`\nTables created (${rows.length}):`);
    rows.forEach((r) => console.log(`  ✅ ${r.table_name}`));
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

// scripts/migrate.mjs
/**
 * Applies every .sql file in db/migrations, in filename order.
 * No ORM — plain `pg` Client running raw SQL. Run with:
 *   npm run db:migrate
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "pg";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "db", "migrations");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "✗ DATABASE_URL is not set. Add it to .env.local before running migrations."
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found in db/migrations.");
      return;
    }

    for (const file of files) {
      const sql = readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`→ Applying ${file} ...`);
      await client.query(sql);
      console.log(`✓ ${file} applied`);
    }

    console.log("\nAll migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});

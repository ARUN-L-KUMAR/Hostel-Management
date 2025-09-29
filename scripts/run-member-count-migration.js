const { neon } = require("@neondatabase/serverless");
require('dotenv').config();

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("Starting member count column migration...");

    // Add the memberCount column if it doesn't exist
    await sql`
      ALTER TABLE outsider_meal_records
      ADD COLUMN IF NOT EXISTS "memberCount" INTEGER DEFAULT 1
    `;

    console.log("✅ Added memberCount column to outsider_meal_records table");

    // Update existing records to have memberCount = 1 if they are NULL
    const updateResult = await sql`
      UPDATE outsider_meal_records
      SET "memberCount" = 1
      WHERE "memberCount" IS NULL
    `;

    console.log(`✅ Updated ${updateResult.length} existing records with memberCount = 1`);

    // Verify the column was added
    const checkResult = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'outsider_meal_records'
      AND column_name = 'memberCount'
    `;

    if (checkResult.length > 0) {
      console.log("✅ Migration completed successfully!");
      console.log("Column details:", checkResult[0]);
    } else {
      console.log("❌ Migration failed - column not found");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
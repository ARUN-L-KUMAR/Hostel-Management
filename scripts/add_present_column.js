const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function addPresentColumn() {
  try {
    await sql`ALTER TABLE meal_records ADD COLUMN IF NOT EXISTS present BOOLEAN DEFAULT false`;
    console.log('Present column added successfully');
  } catch (error) {
    console.error('Error adding present column:', error);
  }
}

addPresentColumn();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runSeed() {
  console.log('[SeedRunner] Connecting to MySQL...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');

    console.log('[SeedRunner] Applying schema...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('[SeedRunner] Schema applied successfully.');

    console.log('[SeedRunner] Applying seed data...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log('[SeedRunner] Seed data loaded successfully.');

    console.log('[SeedRunner] Database initialized successfully!');
  } catch (err) {
    console.error('[SeedRunner] Error during database seeding:', err.message);
  } finally {
    await connection.end();
  }
}

runSeed();

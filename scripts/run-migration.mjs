import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  let client;
  if (connectionString) {
    console.log('Connecting via DATABASE_URL...');
    client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  } else {
    const password = process.env.DATABASE_PASSWORD;
    const projectRef = process.env.SUPABASE_PROJECT_REF || process.env.PROJECT_ID || process.env.PROJECT_REFERENCE_ID || 'zkdyflmrzfzkzmlmkfjm';
    const region = process.env.PROJECT_REGION || 'ap-south-1';

    console.log(`Attempting connection to Supabase DB for project: ${projectRef} (${region})...`);
    
    // Try connection pooler
    client = new Client({
      host: `aws-1-${region}.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${projectRef}`,
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
  }

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS _applied_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const { rows } = await client.query('SELECT name FROM _applied_migrations');
    const appliedSet = new Set(rows.map(r => r.name));

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩ Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`Running migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _applied_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
        console.log(`✅ Successfully applied: ${file}`);
      } catch (fileErr) {
        if (fileErr.message.includes('already exists')) {
          console.log(`ℹ️ Migration objects already exist, marking ${file} as applied.`);
          await client.query('INSERT INTO _applied_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
        } else {
          throw fileErr;
        }
      }
    }

    console.log('🎉 All migrations up-to-date!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

run();

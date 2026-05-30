const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('[v0] Connecting to Neon database...');
    await client.connect();
    console.log('[v0] Connected successfully!');

    const sql = fs.readFileSync('./scripts/add-auth-schema.sql', 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`[v0] Running ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.query(statement);
        console.log(`[v0] ✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // Skip if table already exists
        if (error.code === '42P07' || error.message.includes('already exists')) {
          console.log(`[v0] ⊘ Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          console.error(`[v0] ✗ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('[v0] Migration completed successfully!');
    console.log('[v0] All tables created:');
    console.log('  - users');
    console.log('  - sessions');
    console.log('  - user_follows');
    console.log('  - user_likes');
    console.log('  - user_comments');

  } catch (error) {
    console.error('[v0] Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'darts_analytics',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
      });

  try {
    console.log('Connecting to database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('Tables created successfully!');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed data is optional and is imported once into an empty database.
    const dataPath = [
      process.env.SEED_DATA_PATH,
      path.join(__dirname, 'data.sql'),
      '/etc/secrets/data.sql'
    ].find(candidate => candidate && fs.existsSync(candidate));

    if (dataPath) {
      const { rows } = await pool.query(`
        SELECT
          EXISTS (SELECT 1 FROM games) AS has_games,
          EXISTS (SELECT 1 FROM players) AS has_players,
          EXISTS (SELECT 1 FROM game_players) AS has_game_players,
          EXISTS (SELECT 1 FROM throws) AS has_throws,
          EXISTS (SELECT 1 FROM app_metadata WHERE key = 'seed-data-v1') AS seed_imported
      `);
      const state = rows[0];

      if (state.seed_imported) {
        console.log('Seed data was already imported; skipping.');
      } else if (state.has_games || state.has_players || state.has_game_players || state.has_throws) {
        console.log('Database already contains data; skipping seed import.');
      } else {
        const data = fs.readFileSync(dataPath, 'utf8');
        console.log('Importing seed data...');
        await pool.query('BEGIN');
        try {
          await pool.query(data);
          await pool.query(
            "INSERT INTO app_metadata (key, value) VALUES ('seed-data-v1', 'complete')"
          );
          await pool.query('COMMIT');
          console.log('Seed data imported successfully!');
        } catch (error) {
          await pool.query('ROLLBACK');
          throw error;
        }
      }
    } else {
      console.log('No seed file found; schema is ready with no seed import.');
    }
    
    await pool.end();
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

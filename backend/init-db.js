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
    
    // Seed data is optional. Production data can also be imported separately.
    const dataPath = path.join(__dirname, 'data.sql');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      console.log('Importing seed data...');
      await pool.query(data);
      console.log('Seed data imported successfully!');
    } else {
      console.log('No data.sql found; schema is ready with no seed import.');
    }
    
    await pool.end();
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

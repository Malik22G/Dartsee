const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('Tables created successfully!');
    
    // Read data file
    const dataPath = path.join(__dirname, '..', 'data.sql');
    const data = fs.readFileSync(dataPath, 'utf8');
    
    console.log('Importing data...');
    await pool.query(data);
    console.log('Data imported successfully!');
    
    await pool.end();
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

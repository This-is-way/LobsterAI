/**
 * Reset Cowork execution mode to use new default (sandbox)
 */

const fs = require('fs');
const path = require('path');
const Database = require('sql.js');

const dbPath = path.join(process.env.HOME, 'Library/Application Support/Johnson/johnson.sqlite');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database not found:', dbPath);
  process.exit(1);
}

console.log('🔄 Resetting Cowork execution mode to default (sandbox)...');

const buffer = fs.readFileSync(dbPath);
Database().then((SQL) => {
  const db = new SQL.Database(buffer);

  // Check current value
  const result = db.exec("SELECT value FROM cowork_config WHERE key = 'executionMode'");
  if (result.length > 0 && result[0].values.length > 0) {
    const currentValue = result[0].values[0][0];
    console.log('📋 Current execution mode:', currentValue);

    // Delete the saved value so it falls back to code default
    db.run("DELETE FROM cowork_config WHERE key = 'executionMode'");
    console.log('✅ Reset execution mode to default (sandbox)');

    // Save database
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    console.log('💾 Database saved');
  } else {
    console.log('ℹ️  No saved execution mode found, will use default (sandbox)');
  }
}).catch(console.error);

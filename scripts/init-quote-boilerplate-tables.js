/**
 * Initialize Quote and Boilerplate Database Tables
 * Run this once to set up the tables for quote extraction and boilerplate tracking
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/campaign-editor.db');
const db = new Database(dbPath);

console.log('📂 Connected to database:', dbPath);

// Read SQL schema files
const quotesSQLPath = path.join(__dirname, '../backend/data/quotes-schema.sql');
const boilerplateSQLPath = path.join(__dirname, '../backend/data/boilerplate-schema.sql');

console.log('📄 Reading schema files...');

const quotesSQL = fs.readFileSync(quotesSQLPath, 'utf8');
const boilerplateSQL = fs.readFileSync(boilerplateSQLPath, 'utf8');

try {
    // Execute quote schema
    console.log('\n📊 Creating quote tables...');
    db.exec(quotesSQL);
    console.log('✅ Quote tables created successfully');

    // Execute boilerplate schema
    console.log('\n📋 Creating boilerplate tables...');
    db.exec(boilerplateSQL);
    console.log('✅ Boilerplate tables created successfully');

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name IN (
            'extracted_quotes',
            'quote_modification_warnings',
            'quote_quality_issues',
            'quote_approvals',
            'boilerplate_library',
            'boilerplate_usage',
            'boilerplate_warnings'
        )
    `).all();

    console.log('📊 Created tables:');
    tables.forEach(table => console.log(`  ✓ ${table.name}`));

    if (tables.length === 7) {
        console.log('\n🎉 All tables created successfully!');
    } else {
        console.log(`\n⚠️  Expected 7 tables, but only ${tables.length} were created`);
    }

} catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    process.exit(1);
} finally {
    db.close();
    console.log('\n📂 Database connection closed');
}

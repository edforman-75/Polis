#!/usr/bin/env node

/**
 * Cleanup Duplicate Press Releases
 *
 * Strategy:
 * 1. For each duplicate group (same title):
 *    - Keep reviewed version if exists (prefer most recent)
 *    - Otherwise keep most recent unreviewed
 *    - Delete all others
 */

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./campaign.db');

function promisify(fn) {
    return function(...args) {
        return new Promise((resolve, reject) => {
            fn.call(db, ...args, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };
}

const dbAll = promisify(db.all);
const dbRun = promisify(db.run);

async function cleanupDuplicates() {
    console.log('🔍 Finding duplicate press releases...\n');

    // Find all duplicate groups
    const duplicateGroups = await dbAll(`
        SELECT title, COUNT(*) as count
        FROM parsed_press_releases
        GROUP BY title
        HAVING count > 1
        ORDER BY count DESC
    `);

    console.log(`Found ${duplicateGroups.length} groups of duplicates\n`);

    let totalDeleted = 0;

    for (const group of duplicateGroups) {
        console.log(`\n📋 "${group.title.substring(0, 60)}..." (${group.count} copies)`);

        // Get all records for this title
        const records = await dbAll(`
            SELECT id, reviewed_by, created_at
            FROM parsed_press_releases
            WHERE title = ?
            ORDER BY
                CASE WHEN reviewed_by IS NOT NULL THEN 0 ELSE 1 END,
                created_at DESC
        `, [group.title]);

        // Keep the first one (reviewed + most recent, or just most recent)
        const keepId = records[0].id;
        const keepStatus = records[0].reviewed_by ? `reviewed by ${records[0].reviewed_by}` : 'unreviewed';

        console.log(`   ✅ Keeping ID ${keepId} (${keepStatus})`);

        // Delete the rest
        const deleteIds = records.slice(1).map(r => r.id);

        for (const deleteId of deleteIds) {
            const status = records.find(r => r.id === deleteId).reviewed_by ?
                `reviewed by ${records.find(r => r.id === deleteId).reviewed_by}` : 'unreviewed';
            await dbRun('DELETE FROM parsed_press_releases WHERE id = ?', [deleteId]);
            console.log(`   ❌ Deleted ID ${deleteId} (${status})`);
            totalDeleted++;
        }
    }

    console.log(`\n✨ Cleanup complete! Deleted ${totalDeleted} duplicate records.`);

    // Show final stats
    const finalCount = await dbAll('SELECT COUNT(*) as count FROM parsed_press_releases');
    const reviewedCount = await dbAll('SELECT COUNT(*) as count FROM parsed_press_releases WHERE reviewed_by IS NOT NULL');

    console.log(`\n📊 Database Stats:`);
    console.log(`   Total releases: ${finalCount[0].count}`);
    console.log(`   Reviewed: ${reviewedCount[0].count}`);
    console.log(`   Needs review: ${finalCount[0].count - reviewedCount[0].count}`);
}

cleanupDuplicates()
    .then(() => {
        db.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        db.close();
        process.exit(1);
    });

const PressReleaseParser = require('./backend/utils/press-release-parser.js');

const releases = [
    {
        name: 'Hampton Convocation',
        content: `Spanberger Delivers Keynote Address at Hampton Convocation, Highlights University's Long History of Preparing Leaders for Lives of Service

Spanberger to Students: "Choose Character Over Convenience; Service Over Self-Interest"

HAMPTON, Va. — Congresswoman Abigail Spanberger yesterday delivered the keynote address at Hampton University's 82nd Annual Opening Convocation.

She told students:

"Choose character over convenience; service over self-interest."`,
        expectedSubhead: 'Spanberger to Students: "Choose Character Over Convenience; Service Over Self-Interest"'
    },
    {
        name: 'Government Shutdown Statement',
        content: `RICHMOND, Va. — Congresswoman Abigail Spanberger today released the following statement.

"Virginians are already facing the dire impacts of DOGE."`,
        expectedSubhead: '' // No subhead expected
    },
    {
        name: 'Housing Data',
        content: `NEW: Housing Data Shows More Than 40 Percent of Virginians 'Cannot Realistically Afford Their Rent'

RICHMOND, Va. — Congresswoman Abigail Spanberger continues to lay out her plan.`,
        expectedSubhead: '' // Headline only, no subhead
    }
];

const parser = new PressReleaseParser();

console.log('\n=== SUBHEAD DETECTION TEST ===\n');

releases.forEach(release => {
    const result = parser.parse(release.content);
    const subhead = result.content_structure.subhead || '';

    console.log(`${release.name}:`);
    console.log(`  Expected: "${release.expectedSubhead}"`);
    console.log(`  Found:    "${subhead}"`);

    if (subhead === release.expectedSubhead) {
        console.log(`  ✅ MATCH\n`);
    } else {
        console.log(`  ❌ MISMATCH\n`);
    }
});

const PressReleaseParser = require('./backend/utils/press-release-parser.js');
const WebScraper = require('./backend/utils/web-scraper.js');

// Simulated web content (what we'd get from WebFetch)
const releases = [
    {
        name: 'TV Ad Announcement',
        url: 'https://abigailspanberger.com/new-tv-ad-virginia-law-enforcement-officers/',
        date: 'Sep 30, 2025',
        content: `Sep 30, 2025

RICHMOND, Va. — Congresswoman Abigail Spanberger today released a new TV and digital ad featuring Virginia law enforcement officers.

The ad, "Stand With Her", highlights Spanberger's background as a former federal law enforcement officer.

"Abigail Spanberger stands for safety and security," said Retired Deputy Police Chief John Bell.

In August, the Virginia Police Benevolent Association endorsed Spanberger for Governor. The organization represents nearly 11,000 Virginia law enforcement officers. This was the first time the organization endorsed a Democratic candidate for Governor since 2009.`
    },
    {
        name: 'Fire Fighters Endorsement',
        url: 'https://abigailspanberger.com/virginia-professional-fire-fighters-endorse/',
        date: 'July 01, 2025',
        content: `July 01, 2025

RICHMOND, Va. — Virginia Professional Fire Fighters (VPFF), representing over 10,000 emergency response workers, today endorsed Congresswoman Abigail Spanberger for Governor of Virginia.

"Abigail was one of, if not the leading, champion for fire fighters during her time in the United States Congress," said Robert L. Bragg III, VPFF President.

Spanberger passed the bipartisan Social Security Fairness Act, which was signed into law on January 5, 2025.

"I'm proud to earn VPFF's endorsement to serve as the next Governor of Virginia and to support the emergency personnel who day in and day out put the Commonwealth ahead of themselves," said Spanberger.`
    },
    {
        name: 'Fish Bowl Classic Parade (ICYMI)',
        url: 'https://abigailspanberger.com/icymi-spanberger-participates-in-fish-bowl-classic/',
        date: 'September 29, 2025',
        content: `September 29, 2025

NORFOLK, Va. — Abigail Spanberger participated in the 78th Annual Fish Bowl Classic Parade in Portsmouth.

Spanberger joined the parade with local Democratic leaders including Virginia Senate President Pro Tempore L. Louise Lucas and House Speaker Don Scott.

"Saturday was an incredible day of meeting Virginians across Hampton Roads and spending time together in community," said Spanberger.

Spanberger also performed the ceremonial coin toss at the Old Dominion University vs. Liberty University football game.`
    }
];

const parser = new PressReleaseParser();

console.log('\n' + '='.repeat(80));
console.log('SPANBERGER EXTENDED TEST SUITE');
console.log('Testing additional real-world formats');
console.log('='.repeat(80) + '\n');

releases.forEach((release, index) => {
    console.log(`[${index + 1}/${releases.length}] ${release.name}`);
    console.log('-'.repeat(80));

    const result = parser.parse(release.content);

    // Test dateline
    const dateline = result.content_structure.dateline;
    if (dateline && dateline.location) {
        console.log(`  ✓ Dateline: ${dateline.full || dateline.location}`);
    } else {
        console.log(`  ✗ Dateline: MISSING`);
    }

    // Test quotes
    const quotes = result.quotes;
    console.log(`  Quotes: ${quotes.length} found`);
    quotes.forEach((quote, i) => {
        const preview = quote.quote_text.substring(0, 60) + '...';
        const speaker = quote.speaker_name || 'NONE';
        const title = quote.speaker_title || '';

        if (speaker === 'NONE') {
            console.log(`    ✗ Quote ${i + 1}: NO SPEAKER`);
        } else {
            console.log(`    ✓ Quote ${i + 1}: ${speaker}${title ? ', ' + title : ''}`);
        }
        console.log(`      "${preview}"`);
    });

    console.log();
});

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));

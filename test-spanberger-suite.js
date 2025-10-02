const PressReleaseParser = require('./backend/utils/press-release-parser.js');

const releases = [
    {
        name: 'Government Shutdown Statement',
        date: 'Oct 01, 2025',
        url: 'https://abigailspanberger.com/spanberger-statement-on-government-shutdown/',
        expectedQuotes: 4,
        expectedSpeaker: 'Abigail Spanberger',
        format: 'statement',
        content: `RICHMOND, Va. — Congresswoman Abigail Spanberger today released the following statement.

"Virginians are already facing the dire impacts of DOGE, reckless tariffs, and attacks on their healthcare coverage. And now, our Commonwealth faces totally unnecessary job cuts as President Trump promises to enact mass firings."

"With each new attack from the White House, Winsome Earle-Sears fails to stand up for Virginia's families, workforce, and economy. Just yesterday, when given multiple opportunities to publicly ask the President to stop further cuts to Virginia jobs, she outright refused to do so."

"We need a Governor who will put Virginia first, no matter who is in the White House or which party controls the levers of power across the Potomac. As Governor, I will remain focused on lowering costs for Virginia families, protecting access to affordable healthcare, and — critically — always standing up for Virginia jobs and businesses."

"President Trump must reverse course and work in good faith to end this shutdown as soon as possible. And we need leaders in Richmond who will demand this of the President, not use this moment as an opportunity to punish even more Virginians."`
    },
    {
        name: 'Hampton Convocation Speech',
        date: 'Sep 29, 2025',
        url: 'https://abigailspanberger.com/spanberger-delivers-keynote-address-at-hampton-convocation/',
        expectedQuotes: 1,
        expectedSpeaker: 'Abigail Spanberger',
        format: 'speech',
        content: `Sep 29, 2025

HAMPTON, Va. — Congresswoman Abigail Spanberger delivered the keynote address at Hampton University's 82nd Annual Opening Convocation before an audience of more than 2,000 attendees.

In her remarks, Spanberger emphasized themes of service, character, and leadership. She told students:

"Choose character over convenience; service over self-interest. And keep in mind that the achievement of your goals and progress itself requires persistence."

Spanberger discussed her background in federal law enforcement and the CIA, and highlighted Hampton University's legacy of developing leaders who make a difference in their communities.`
    },
    {
        name: 'Housing Data Release',
        date: 'Sep 25, 2025',
        url: 'https://abigailspanberger.com/new-housing-data-shows-more-than-40-percent-of-virginians-cannot-realistically-afford-their-rent/',
        expectedQuotes: 1,
        expectedSpeaker: 'Connor Joseph',
        format: 'spokesperson',
        content: `Sep 25, 2025

RICHMOND, Va. — Congresswoman Abigail Spanberger continues to lay out her plan to lower housing costs for Virginia families as federal data — highlighted by RadioIQ/WVTF — shows "four out of 10 people who are renting in Virginia cannot realistically afford their rent."

Last week, on the first day of early voting in Virginia, Spanberger discussed how her Affordable Virginia Plan will save Virginians money and help more families build a life here in the Commonwealth.

"High costs are the top concern Abigail hears from Virginians across the Commonwealth, and she knows that housing costs are a big part of the problem for both renters and buyers," said Connor Joseph, Communications Director, Spanberger for Governor.

According to the data, 42 percent of Virginians are considered "rent burdened," meaning they spend more than 30 percent of their income on rent.`
    },
    {
        name: 'AFGE Endorsement',
        date: 'Sep 26, 2025',
        url: 'https://abigailspanberger.com/icymi-american-federation-of-government-employees-endorses-spanberger/',
        expectedQuotes: 2,
        expectedSpeaker: null, // Multiple third-party speakers
        format: 'endorsement',
        content: `Sep 26, 2025

RICHMOND, Va. — The American Federation of Government Employees (AFGE) endorsed Congresswoman Abigail Spanberger for Governor of Virginia. AFGE represents over 800,000 federal employees, including tens of thousands in Virginia.

"Abigail understands that our federal workforce is the backbone of our communities and our nation's security," said Ottis Johnson Jr., AFGE District 14 National Vice President.

"With Abigail in the Governor's office, federal employees living in Virginia will have an advocate," said Christine Surrette, AFGE District 4 National Vice President.

Spanberger has proposed a Growing Virginia Plan to support workforce training and economic development.`
    }
];

const parser = new PressReleaseParser();

console.log('\n' + '='.repeat(80));
console.log('SPANBERGER PRESS RELEASE TEST SUITE');
console.log('Testing real-world campaign releases for parser robustness');
console.log('='.repeat(80) + '\n');

let totalTests = 0;
let passedTests = 0;
let totalQuotes = 0;
let quotesWithSpeakers = 0;

releases.forEach((release, index) => {
    console.log(`[${index + 1}/${releases.length}] ${release.name} (${release.format})`);
    console.log('-'.repeat(80));

    const result = parser.parse(release.content);
    const quotes = result.quotes;

    totalTests++;
    let testPassed = true;

    // Test: Dateline extraction
    const dateline = result.content_structure.dateline;
    if (dateline && dateline.location) {
        console.log(`  ✓ Dateline: ${dateline.full || dateline.location}`);
    } else {
        console.log(`  ✗ Dateline: FAILED - No location found`);
        testPassed = false;
    }

    // Test: Quote count
    if (quotes.length === release.expectedQuotes) {
        console.log(`  ✓ Quote count: ${quotes.length}/${release.expectedQuotes}`);
    } else {
        console.log(`  ✗ Quote count: ${quotes.length}/${release.expectedQuotes} EXPECTED`);
        testPassed = false;
    }

    // Test: Quote attribution
    quotes.forEach((quote, i) => {
        totalQuotes++;
        const preview = quote.quote_text.substring(0, 50) + '...';
        const speaker = quote.speaker_name || 'NONE';
        const title = quote.speaker_title || '';

        if (quote.speaker_name) {
            quotesWithSpeakers++;
            console.log(`  ✓ Quote ${i + 1}: ${speaker}${title ? ', ' + title : ''}`);
            console.log(`    "${preview}"`);
        } else {
            console.log(`  ✗ Quote ${i + 1}: NO SPEAKER`);
            console.log(`    "${preview}"`);
            testPassed = false;
        }
    });

    // Special validation for expected speaker
    if (release.expectedSpeaker) {
        const allHaveExpectedSpeaker = quotes.every(q =>
            q.speaker_name && q.speaker_name.includes(release.expectedSpeaker.split(' ')[0])
        );
        if (!allHaveExpectedSpeaker) {
            console.log(`  ⚠ WARNING: Not all quotes attributed to ${release.expectedSpeaker}`);
        }
    }

    console.log();
    if (testPassed) {
        console.log(`  ✅ PASS\n`);
        passedTests++;
    } else {
        console.log(`  ❌ FAILED\n`);
    }
});

console.log('='.repeat(80));
console.log('SUMMARY REPORT');
console.log('='.repeat(80) + '\n');

console.log(`Total releases tested: ${totalTests}`);
console.log(`Passed: ${passedTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
console.log(`Failed: ${totalTests - passedTests}\n`);

console.log(`Total quotes found: ${totalQuotes}`);
console.log(`Quotes with speaker attribution: ${quotesWithSpeakers} (${(quotesWithSpeakers/totalQuotes*100).toFixed(1)}%)\n`);

console.log('Format Coverage:');
releases.forEach(r => {
    console.log(`  - ${r.format}: ${r.name}`);
});

console.log('\n' + '='.repeat(80));
console.log('TEST SUITE COMPLETE');
console.log('='.repeat(80) + '\n');

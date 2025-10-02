const PressReleaseParser = require('./backend/utils/press-release-parser.js');

// Spanberger statement format test
const spanbergerContent = `RICHMOND, Va. — Congresswoman Abigail Spanberger today released the following statement.

"Virginians are already facing the dire impacts of DOGE, reckless tariffs, and attacks on their healthcare coverage. And now, our Commonwealth faces totally unnecessary job cuts as President Trump promises to enact mass firings."

"With each new attack from the White House, Winsome Earle-Sears fails to stand up for Virginia's families, workforce, and economy. Just yesterday, when given multiple opportunities to publicly ask the President to stop further cuts to Virginia jobs, she outright refused to do so."

"We need a Governor who will put Virginia first, no matter who is in the White House or which party controls the levers of power across the Potomac. As Governor, I will remain focused on lowering costs for Virginia families, protecting access to affordable healthcare, and — critically — always standing up for Virginia jobs and businesses."

"President Trump must reverse course and work in good faith to end this shutdown as soon as possible. And we need leaders in Richmond who will demand this of the President, not use this moment as an opportunity to punish even more Virginians."`;

const parser = new PressReleaseParser();
const result = parser.parse(spanbergerContent);

console.log('\n=== STATEMENT FORMAT TEST (Improvement #006) ===\n');
console.log(`Quotes Found: ${result.quotes.length}`);
console.log(`Quotes with Speaker Names: ${result.quotes.filter(q => q.speaker_name).length}\n`);

result.quotes.forEach((quote, i) => {
    const preview = quote.quote_text.substring(0, 60) + '...';
    console.log(`Quote ${i + 1}:`);
    console.log(`  Text: "${preview}"`);
    console.log(`  Speaker: ${quote.speaker_name || 'NONE'}`);
    console.log(`  Title: ${quote.speaker_title || 'NONE'}`);
    console.log();
});

// Success criteria
const success = result.quotes.length === 4 &&
                result.quotes.every(q => q.speaker_name);

console.log(success ? '✅ SUCCESS: All 4 quotes attributed to Abigail Spanberger' :
                      '❌ FAILED: Missing speaker attributions');

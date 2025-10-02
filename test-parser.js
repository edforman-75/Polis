const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Test with the Detroit economy example
const economySample = `Detroit Secures $800 Million Battery Plant, Creating 2,500 Good-Paying Jobs

DETROIT, MI - October 1, 2025 - Mayor James Wilson announced that automotive manufacturer ElectricFuture Inc. will build a new $800 million battery plant in Detroit, creating 2,500 high-paying jobs over the next three years.

"This is exactly the kind of good-paying, advanced manufacturing jobs Detroit needs," said Mayor Wilson at the groundbreaking ceremony. "Our city is leading the electric vehicle revolution."

The new facility will produce lithium-ion batteries for electric vehicles and is expected to begin operations in early 2027. The company received $150 million in state tax incentives and workforce training grants.

"Detroit's skilled workforce and strategic location make it the perfect home for our expansion," said ElectricFuture CEO Jennifer Martinez. "We're excited to be part of this city's comeback story."

The project includes commitments to hire from local communities and provide apprenticeship programs for Detroit residents.`;

const healthcareSample = `Governor Smith Unveils Plan to Expand Healthcare Access to 150,000 Uninsured Residents

BOSTON, MA - October 1, 2025 - Governor Sarah Smith today unveiled a comprehensive plan to expand healthcare access to 150,000 uninsured Massachusetts residents. The initiative will provide affordable coverage and prescription drug benefits to working families across the Commonwealth.

"Too many families in Massachusetts are forced to choose between paying rent and buying medicine," said Governor Smith at a press conference this morning. "That's wrong, and we can do better."

The plan includes three major components: expanding Medicaid eligibility to families earning up to 200% of the federal poverty level, creating a prescription drug affordability board to negotiate lower prices, and establishing community health centers in underserved areas.

Health policy experts estimate the program will cost $2.1 billion over five years, funded through a combination of federal matching funds and a small payroll tax on high earners. The initiative has broad support from healthcare advocates and business leaders.

The healthcare expansion bill will be introduced in the state legislature next week. Governor Smith said she expects bipartisan support for the measure, which has been endorsed by the Massachusetts Medical Society and the Chamber of Commerce.`;

console.log('\n=== TESTING DETROIT ECONOMY SAMPLE ===\n');
const result1 = parser.parse(economySample);
console.log('Headline:', result1.content_structure?.headline);
console.log('Dateline:', result1.content_structure?.dateline?.full);
console.log('Lead Paragraph:', result1.content_structure?.lead_paragraph);
console.log('\nQuotes found:', result1.quotes ? result1.quotes.length : 0);
console.log('Expected: 2 quotes (combined multi-part quotes)');
if (result1.quotes && result1.quotes.length > 0) {
    result1.quotes.forEach((q, i) => {
        console.log(`\nQuote ${i+1}:`);
        console.log('  Text:', q.quote_text);
        console.log('  Speaker:', q.speaker_name);
        console.log('  Title:', q.speaker_title);
        console.log('  Attribution:', q.full_attribution);
        if (result1.quotes.length === 2) {
            console.log('  ✅ COMBINED CORRECTLY');
        }
    });
} else {
    console.log('❌ NO QUOTES EXTRACTED');
}

if (result1.quotes.length === 2) {
    console.log('\n✅ BUG #1 FIXED: Multi-part quotes combined');
} else {
    console.log(`\n❌ BUG #1 NOT FIXED: Expected 2 quotes, got ${result1.quotes.length}`);
}

// Check Bug #2
const quote3 = result1.quotes.find(q => q.speaker_title?.includes('CEO'));
if (quote3 && quote3.speaker_name === 'Jennifer Martinez') {
    console.log('✅ BUG #2 FIXED: Corporate speaker name correct');
} else {
    console.log(`❌ BUG #2 NOT FIXED: Expected "Jennifer Martinez", got "${quote3?.speaker_name}"`);
}

console.log('\n\n=== TESTING HEALTHCARE SAMPLE ===\n');
const result2 = parser.parse(healthcareSample);
console.log('Headline:', result2.content_structure?.headline);
console.log('Dateline:', result2.content_structure?.dateline?.full);
console.log('Lead Paragraph:', result2.content_structure?.lead_paragraph);
console.log('\nQuotes found:', result2.quotes ? result2.quotes.length : 0);
console.log('Expected: 1 quote (combined multi-part quote)');
if (result2.quotes && result2.quotes.length > 0) {
    result2.quotes.forEach((q, i) => {
        console.log(`\nQuote ${i+1}:`);
        console.log('  Text:', q.quote_text);
        console.log('  Speaker:', q.speaker_name);
        console.log('  Title:', q.speaker_title);
        console.log('  Attribution:', q.full_attribution);
    });
} else {
    console.log('❌ NO QUOTES EXTRACTED');
}

// Check Bug #3
const govQuote = result2.quotes.find(q => q.speaker_title?.includes('Governor'));
if (govQuote && govQuote.speaker_title === 'Governor of Massachusetts') {
    console.log('\n✅ BUG #3 FIXED: Governor location correct');
} else {
    console.log(`\n❌ BUG #3 NOT FIXED: Expected "Governor of Massachusetts", got "${govQuote?.speaker_title}"`);
}

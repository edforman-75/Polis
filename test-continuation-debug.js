const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

// Monkey-patch to add debug logging
const originalExtract = PressReleaseParser.prototype.extractRegularQuotes;
PressReleaseParser.prototype.extractRegularQuotes = function(text, skipPositions = []) {
    // Copy the original method with added debug logging
    const rawQuotes = [];
    let previousSpeaker = null;

    const quotePattern = /"([^"]+?)"|\u201C([^\u201C\u201D]+?)\u201D/g;
    let match;
    let quoteNum = 0;

    while ((match = quotePattern.exec(text)) !== null) {
        quoteNum++;
        const quoteStartPos = match.index;
        const quoteEndPos = quoteStartPos + match[0].length;

        const isPartOfMultiPara = skipPositions.some(range =>
            quoteStartPos >= range.start && quoteStartPos < range.end
        );

        if (isPartOfMultiPara) {
            continue;
        }

        const quoteText = (match[1] || match[2]).trim();
        const lastCharOfQuote = quoteText.slice(-1);
        const isMultiPartQuote = (lastCharOfQuote === ',');
        const isEndOfQuote = (lastCharOfQuote === '.');

        const contextAfter = text.substring(quoteEndPos, quoteEndPos + 200);

        const afterPattern = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([^."]+?)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|\.|$)/i;
        const afterMatch = contextAfter.match(afterPattern);

        const reversedPattern = /^[,\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(said|stated|announced|noted|explained|added|continued|emphasized|told)/i;
        const reversedMatch = contextAfter.match(reversedPattern);

        const pronounPattern = /^[,\s]*(she|he|they)\s+(said|stated|announced|noted|explained|added|told)/i;
        const pronounMatch = contextAfter.match(pronounPattern);

        console.log(`\n=== Quote ${quoteNum} ===`);
        console.log(`Text: "${quoteText.substring(0, 40)}..."`);
        console.log(`Context after: "${contextAfter.substring(0, 50)}..."`);
        console.log(`previousSpeaker: ${previousSpeaker || 'null'}`);
        console.log(`afterMatch: ${afterMatch ? 'YES' : 'NO'}`);
        console.log(`reversedMatch: ${reversedMatch ? 'YES' : 'NO'}`);
        console.log(`pronounMatch: ${pronounMatch ? 'YES' : 'NO'}`);

        let attribution = null;
        let speaker_name = '';

        if (afterMatch) {
            attribution = afterMatch[2].trim();
            speaker_name = afterMatch[2].trim();
            console.log(`-> Using afterMatch: "${attribution}"`);
        } else if (reversedMatch) {
            const name = reversedMatch[1].trim();
            const verb = reversedMatch[2].trim();
            attribution = `${name} ${verb}`;
            speaker_name = name;
            console.log(`-> Using reversedMatch: "${attribution}", speaker="${speaker_name}"`);
        } else if (pronounMatch) {
            const pronoun = pronounMatch[1];
            const verb = pronounMatch[2];
            attribution = `${pronoun} ${verb}`;

            const continuationVerbs = /^(added|continued|stated)$/i;
            console.log(`-> Pronoun match: pronoun="${pronoun}", verb="${verb}"`);
            console.log(`   continuationVerbs.test("${verb}"): ${continuationVerbs.test(verb)}`);
            console.log(`   previousSpeaker exists: ${!!previousSpeaker}`);

            if (continuationVerbs.test(verb) && previousSpeaker) {
                speaker_name = previousSpeaker;
                console.log(`   -> Using previousSpeaker: "${speaker_name}"`);
            } else {
                speaker_name = pronoun;
                console.log(`   -> Using pronoun: "${speaker_name}"`);
            }
        }

        rawQuotes.push({
            quote_text: quoteText,
            speaker_name: speaker_name,
            full_attribution: attribution || 'Unknown Speaker',
            position: quoteStartPos
        });

        console.log(`Final speaker_name for quote ${quoteNum}: "${speaker_name}"`);

        if (speaker_name) {
            previousSpeaker = speaker_name;
            console.log(`Updated previousSpeaker to: "${previousSpeaker}"`);
        }
    }

    return rawQuotes;
};

const parser = new PressReleaseParser();
const filePath = path.join(__dirname, 'cpo_examples', 'porter_02_momentum.txt');
const text = fs.readFileSync(filePath, 'utf8');
const result = parser.parse(text);

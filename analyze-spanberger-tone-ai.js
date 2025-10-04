const aiService = require('./backend/services/ai-service');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const parser = new PressReleaseParser();

async function analyzeTone() {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('       SPANBERGER PRESS RELEASE - AI TONE ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    // Analyze first release
    const testFile = 'spanberger_01_mass_firings.txt';
    const filepath = path.join('./cpo_examples', testFile);
    const text = fs.readFileSync(filepath, 'utf8');

    const structure = parser.extractContentStructure(text);
    const bodyText = [structure.lead_paragraph, ...structure.body_paragraphs]
        .filter(p => p.trim().length > 0)
        .join('\n\n');

    console.log(`FILE: ${testFile}`);
    console.log(`HEADLINE: ${structure.headline}`);
    console.log();
    console.log('─'.repeat(79));
    console.log();

    const prompt = `Analyze the tone of this Democratic press release from Rep. Abigail Spanberger:

CONTENT:
${bodyText.substring(0, 1500)}...

Please analyze:
1. Overall emotional tone (angry, concerned, empathetic, determined, etc.)
2. Target audience (who is this trying to reach?)
3. Rhetorical approach (attack, defend, inspire, inform)
4. Urgency level (crisis/immediate, important, routine)
5. Key messaging strengths
6. Tone weaknesses or missed opportunities

For a Democratic candidate addressing Trump administration actions that hurt constituents, what would be the IDEAL tone? Compare the current tone to that ideal.

Format as JSON with these exact fields:
{
  "currentTone": {
    "emotional": "primary emotion",
    "audience": "target audience",
    "approach": "rhetorical approach",
    "urgency": "urgency level"
  },
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "idealTone": {
    "emotional": "what it should be",
    "audience": "who to target",
    "approach": "best approach",
    "urgency": "ideal urgency"
  },
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}`;

    console.log('Calling OpenAI for tone analysis (this may take a few seconds)...');
    console.log();

    try {
        const response = await aiService.generateResponse(prompt, {
            maxLength: 1000,
            temperature: 0.3
        });

        console.log('AI TONE ANALYSIS:');
        console.log('─'.repeat(79));
        console.log();

        // Try to parse as JSON
        try {
            const analysis = JSON.parse(response);

            console.log('CURRENT TONE:');
            console.log(`  Emotional: ${analysis.currentTone.emotional}`);
            console.log(`  Audience: ${analysis.currentTone.audience}`);
            console.log(`  Approach: ${analysis.currentTone.approach}`);
            console.log(`  Urgency: ${analysis.currentTone.urgency}`);
            console.log();

            console.log('STRENGTHS:');
            analysis.strengths.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
            console.log();

            console.log('WEAKNESSES:');
            analysis.weaknesses.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
            console.log();

            console.log('IDEAL TONE FOR DEMOCRATIC MESSAGING:');
            console.log(`  Emotional: ${analysis.idealTone.emotional}`);
            console.log(`  Audience: ${analysis.idealTone.audience}`);
            console.log(`  Approach: ${analysis.idealTone.approach}`);
            console.log(`  Urgency: ${analysis.idealTone.urgency}`);
            console.log();

            console.log('RECOMMENDATIONS:');
            analysis.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
            console.log();

        } catch (parseError) {
            // If not JSON, print raw response
            console.log(response);
            console.log();
        }

    } catch (error) {
        console.error('Error calling AI:', error.message);
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════');
}

analyzeTone();

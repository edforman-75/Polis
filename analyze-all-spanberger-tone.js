const aiService = require('./backend/services/ai-service');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const parser = new PressReleaseParser();

async function analyzeAllReleases() {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('   COMPLETE SPANBERGER TONE ANALYSIS - ALL 14 RELEASES');
    console.log('   Comparing against DEFAULT TONE: Empathetic & Determined / Inspire & Inform');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    // Get all Spanberger files
    const files = fs.readdirSync('./cpo_examples')
        .filter(f => f.startsWith('spanberger_'))
        .sort();

    console.log(`Found ${files.length} Spanberger press releases`);
    console.log();
    console.log('Analyzing each release with AI (this will take 1-2 minutes)...');
    console.log();

    const results = [];

    for (let i = 0; i < files.length; i++) {
        const filename = files[i];
        const filepath = path.join('./cpo_examples', filename);
        const text = fs.readFileSync(filepath, 'utf8');

        const structure = parser.extractContentStructure(text);
        const bodyText = [structure.lead_paragraph, ...structure.body_paragraphs]
            .filter(p => p.trim().length > 0)
            .join('\n\n');

        console.log(`[${i + 1}/${files.length}] Analyzing ${filename}...`);

        const prompt = `Analyze this Democratic press release tone vs DEFAULT IDEAL:

DEFAULT IDEAL TONE:
- Emotional: Empathetic and determined
- Rhetorical: Inspire and inform
- Urgency: Important (not crisis)
- Audience: General public

HEADLINE: ${structure.headline}

CONTENT (first 1200 chars):
${bodyText.substring(0, 1200)}...

Analyze:
1. Current emotional tone
2. Current rhetorical approach
3. Current urgency level
4. How far is it from the DEFAULT IDEAL?
5. Is this a MATCH (close to ideal), MISALIGNED (notably different), or OPPOSITE (contradicts ideal)?

Return JSON:
{
  "emotional": "current emotional tone",
  "rhetorical": "current approach",
  "urgency": "current urgency",
  "assessment": "MATCH | MISALIGNED | OPPOSITE",
  "gap": "1-sentence description of main difference from ideal",
  "recommendation": "1-sentence fix to align with ideal"
}`;

        try {
            const response = await aiService.generateResponse(prompt, {
                maxLength: 300,
                temperature: 0.3
            });

            // Parse JSON from response (may be wrapped in markdown)
            let analysis;
            try {
                // Try to extract JSON from markdown code blocks
                const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                                 response.match(/```\s*([\s\S]*?)\s*```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : response;
                analysis = JSON.parse(jsonStr);
            } catch (e) {
                console.log(`  Warning: Could not parse JSON for ${filename}`);
                analysis = {
                    emotional: "unknown",
                    rhetorical: "unknown",
                    urgency: "unknown",
                    assessment: "ERROR",
                    gap: "Parse error",
                    recommendation: "N/A"
                };
            }

            results.push({
                filename,
                headline: structure.headline,
                ...analysis
            });

            console.log(`  ✓ ${analysis.assessment} - ${analysis.emotional}`);

        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            results.push({
                filename,
                headline: structure.headline,
                emotional: "error",
                rhetorical: "error",
                urgency: "error",
                assessment: "ERROR",
                gap: error.message,
                recommendation: "N/A"
            });
        }

        // Small delay to avoid rate limiting
        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log();
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                           RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    // Count by assessment
    const matches = results.filter(r => r.assessment === 'MATCH').length;
    const misaligned = results.filter(r => r.assessment === 'MISALIGNED').length;
    const opposite = results.filter(r => r.assessment === 'OPPOSITE').length;

    console.log(`OVERALL ALIGNMENT WITH DEFAULT TONE:`);
    console.log(`  ✓ MATCH (on target):        ${matches}/14 (${Math.round(matches/14*100)}%)`);
    console.log(`  ⚠ MISALIGNED (off target):  ${misaligned}/14 (${Math.round(misaligned/14*100)}%)`);
    console.log(`  ✗ OPPOSITE (wrong direction): ${opposite}/14 (${Math.round(opposite/14*100)}%)`);
    console.log();

    // Group by emotional tone
    const emotionalTones = {};
    results.forEach(r => {
        const tone = r.emotional.toLowerCase();
        emotionalTones[tone] = (emotionalTones[tone] || 0) + 1;
    });

    console.log('EMOTIONAL TONE DISTRIBUTION:');
    Object.entries(emotionalTones)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tone, count]) => {
            console.log(`  ${tone}: ${count} releases`);
        });
    console.log();

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                        DETAILED FINDINGS');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    results.forEach((r, idx) => {
        const icon = r.assessment === 'MATCH' ? '✓' : r.assessment === 'MISALIGNED' ? '⚠' : '✗';

        console.log(`${idx + 1}. ${icon} ${r.assessment} - ${r.filename}`);
        console.log(`   HEADLINE: ${r.headline.substring(0, 70)}...`);
        console.log(`   Current Tone: ${r.emotional} | ${r.rhetorical} | ${r.urgency}`);
        console.log(`   Gap: ${r.gap}`);
        console.log(`   Fix: ${r.recommendation}`);
        console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                        KEY TAKEAWAYS');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    if (matches > 10) {
        console.log('✓ EXCELLENT: Most releases align with empathetic & determined / inspire & inform tone');
    } else if (matches > 5) {
        console.log('⚠ MIXED: About half the releases align with the default ideal tone');
    } else {
        console.log('✗ MISALIGNMENT: Most releases do not match the empathetic & determined ideal');
    }
    console.log();

    if (opposite > 5) {
        console.log('⚠ CONCERN: Many releases take the OPPOSITE approach from the default ideal');
        console.log('  This suggests either:');
        console.log('  a) The campaign has chosen a different strategic tone (e.g., more aggressive)');
        console.log('  b) The releases need significant tone adjustment to match the ideal');
        console.log();
    }

    const needWork = results.filter(r => r.assessment !== 'MATCH');
    if (needWork.length > 0) {
        console.log(`ACTION NEEDED: ${needWork.length} releases should be adjusted to align with default tone`);
    }

    console.log();
    console.log('═══════════════════════════════════════════════════════════════════════════════');
}

analyzeAllReleases().catch(console.error);

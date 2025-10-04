const aiService = require('./backend/services/ai-service');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const parser = new PressReleaseParser();

async function analyzeWithProfile() {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('   SPANBERGER RELEASES - OPTIMIZATION FOR "CONCERNED PROTECTOR" PROFILE');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();
    console.log('TARGET PROFILE: Concerned Protector');
    console.log('  - Emotional: Concerned and protective');
    console.log('  - Rhetorical: Critique and advocate');
    console.log('  - Urgency: Crisis to highly important');
    console.log('  - Use case: Moderate districts, defending constituents from harmful policies');
    console.log();
    console.log('─'.repeat(79));
    console.log();

    // Get all Spanberger files
    const files = fs.readdirSync('./cpo_examples')
        .filter(f => f.startsWith('spanberger_'))
        .sort();

    console.log(`Found ${files.length} releases. Analyzing each for optimization opportunities...`);
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

        console.log(`[${i + 1}/${files.length}] ${filename}`);
        console.log(`HEADLINE: ${structure.headline.substring(0, 70)}...`);
        console.log();

        const prompt = `Analyze this press release against the "CONCERNED PROTECTOR" strategic profile:

TARGET PROFILE:
- Emotional: Concerned and protective (of constituents)
- Rhetorical: Critique (of harmful actions) and advocate (for constituents)
- Urgency: Crisis to highly important
- Strategy: Moderate district, defending constituents from Republican policies

HEADLINE: ${structure.headline}

CONTENT (first 1200 chars):
${bodyText.substring(0, 1200)}...

Analyze:
1. Does this release effectively use the "concerned protector" tone?
2. What's working well with this strategic approach?
3. What specific improvements would strengthen this profile?
4. Any headline or opening improvements?

Return JSON:
{
  "profileAlignment": "STRONG | MODERATE | WEAK",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": [
    {
      "area": "headline | opening | body | tone",
      "issue": "what needs improvement",
      "suggestion": "specific concrete fix"
    }
  ],
  "rewriteSuggestion": "If needed: 1-2 sentence alternative opening that better captures concerned protector tone"
}`;

        try {
            const response = await aiService.generateResponse(prompt, {
                maxLength: 500,
                temperature: 0.3
            });

            // Parse JSON from response
            let analysis;
            try {
                const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                                 response.match(/```\s*([\s\S]*?)\s*```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : response;
                analysis = JSON.parse(jsonStr);
            } catch (e) {
                console.log(`  ⚠ Parse error - skipping`);
                analysis = {
                    profileAlignment: "ERROR",
                    strengths: [],
                    improvements: [],
                    rewriteSuggestion: ""
                };
            }

            results.push({
                filename,
                headline: structure.headline,
                ...analysis
            });

            const icon = analysis.profileAlignment === 'STRONG' ? '✓' :
                        analysis.profileAlignment === 'MODERATE' ? '○' : '✗';

            console.log(`  ${icon} ${analysis.profileAlignment} alignment`);
            if (analysis.strengths.length > 0) {
                console.log(`  Strengths: ${analysis.strengths[0]}`);
            }
            if (analysis.improvements.length > 0) {
                console.log(`  Top improvement: ${analysis.improvements[0].suggestion}`);
            }
            console.log();

        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            console.log();
        }

        // Rate limiting
        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                           OPTIMIZATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    const strong = results.filter(r => r.profileAlignment === 'STRONG').length;
    const moderate = results.filter(r => r.profileAlignment === 'MODERATE').length;
    const weak = results.filter(r => r.profileAlignment === 'WEAK').length;

    console.log(`PROFILE ALIGNMENT:`);
    console.log(`  ✓ STRONG:   ${strong}/14 (${Math.round(strong/14*100)}%)`);
    console.log(`  ○ MODERATE: ${moderate}/14 (${Math.round(moderate/14*100)}%)`);
    console.log(`  ✗ WEAK:     ${weak}/14 (${Math.round(weak/14*100)}%)`);
    console.log();

    // Common improvement patterns
    const improvementAreas = {};
    results.forEach(r => {
        r.improvements.forEach(imp => {
            improvementAreas[imp.area] = (improvementAreas[imp.area] || 0) + 1;
        });
    });

    if (Object.keys(improvementAreas).length > 0) {
        console.log('MOST COMMON IMPROVEMENT AREAS:');
        Object.entries(improvementAreas)
            .sort((a, b) => b[1] - a[1])
            .forEach(([area, count]) => {
                console.log(`  ${area}: ${count} releases need work here`);
            });
        console.log();
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                        DETAILED RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    results.forEach((r, idx) => {
        if (r.profileAlignment === 'WEAK' || r.improvements.length > 0) {
            const icon = r.profileAlignment === 'STRONG' ? '✓' :
                        r.profileAlignment === 'MODERATE' ? '○' : '✗';

            console.log(`${idx + 1}. ${icon} ${r.filename}`);
            console.log(`   HEADLINE: ${r.headline.substring(0, 70)}...`);
            console.log();

            if (r.strengths.length > 0) {
                console.log(`   ✓ STRENGTHS:`);
                r.strengths.forEach(s => console.log(`     - ${s}`));
                console.log();
            }

            if (r.improvements.length > 0) {
                console.log(`   IMPROVEMENTS NEEDED:`);
                r.improvements.forEach(imp => {
                    console.log(`     [${imp.area.toUpperCase()}] ${imp.issue}`);
                    console.log(`     → ${imp.suggestion}`);
                    console.log();
                });
            }

            if (r.rewriteSuggestion) {
                console.log(`   REWRITE SUGGESTION:`);
                console.log(`     "${r.rewriteSuggestion}"`);
                console.log();
            }

            console.log('   ' + '─'.repeat(75));
            console.log();
        }
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();
    console.log('Next steps:');
    console.log('1. Review the specific suggestions above');
    console.log('2. Apply the "concerned_protector" profile via API: POST /api/tone-settings/apply-profile');
    console.log('3. Use the tone analyzer on new content to maintain consistency');
    console.log();
}

analyzeWithProfile().catch(console.error);

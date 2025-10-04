require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const db = require('./backend/database/init');
const { initializeParsedPressReleasesTable, saveParsedPressRelease } = require('./backend/database/parsed-press-releases');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an expert political communications analyst specializing in campaign press releases.

Analyze press releases and extract:
1. Release type (policy_position, campaign_announcement, endorsement, attack_ad, response_statement, media_appearance, event_announcement, coalition_building, legislative_action)
2. Release subtypes (contrast, fact_check, rapid_response, coalition_building, grassroots_mobilization, media_strategy, policy_rollout, opposition_research, defensive, proactive, campaign_milestone, voter_mobilization, campaign_statement)
3. Key issues (healthcare, local_economy, national_economy, education, climate, immigration, abortion, gun_control, taxes, jobs, infrastructure, national_security, veterans, social_security, medicare, criminal_justice, voting_rights, housing, transportation, technology, trade, foreign_policy, energy, agriculture, federal_workforce)
4. Metadata (candidate name, state, location, word count, date if present)

Return JSON only:
{
  "release_type": "type",
  "confidence": 0.95,
  "subtypes": ["subtype1", "subtype2"],
  "issues": ["issue1", "issue2"],
  "metadata": {
    "candidate_name": "Name",
    "state": "State",
    "location": "City",
    "word_count": 500
  }
}`;

async function parseRelease(content) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Analyze this press release:\n\n${content}` }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('Parse error:', error);
        return null;
    }
}

async function batchParseAll() {
    // Initialize database connection first
    console.log('📂 Connecting to database...');
    await db.initialize();

    console.log('📊 Initializing parsed releases table...');
    await initializeParsedPressReleasesTable();

    const cpoDir = path.join(__dirname, 'cpo_examples');
    const files = await fs.readdir(cpoDir);
    const spanbergerFiles = files.filter(f => f.startsWith('spanberger_') && f.endsWith('.txt'));

    console.log(`\n🚀 Starting batch parse of ${spanbergerFiles.length} releases...\n`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const filename of spanbergerFiles) {
        try {
            console.log(`📄 Processing: ${filename}`);

            const filePath = path.join(cpoDir, filename);
            const content = await fs.readFile(filePath, 'utf-8');
            const title = content.split('\n')[0].trim();

            // Parse with AI
            const parsed = await parseRelease(content);

            if (!parsed) {
                console.log(`   ❌ Parse failed\n`);
                errorCount++;
                continue;
            }

            // Save to database
            const saveData = {
                title: title.substring(0, 200),
                content,
                release_type: parsed.release_type,
                release_subtype: parsed.subtypes?.[0] || null,
                confidence: parsed.confidence || 0.9,
                subtypes: parsed.subtypes || [],
                issues: parsed.issues || [],
                metadata: parsed.metadata || {},
                parsed_data: parsed,
                source_file: filename,
                reviewed_by: null // Auto-parsed, not human-reviewed
            };

            const result = await saveParsedPressRelease(saveData);

            console.log(`   ✅ Saved as ID ${result.id}`);
            console.log(`   📊 Type: ${parsed.release_type}`);
            console.log(`   🏷️  Subtypes: ${parsed.subtypes?.join(', ') || 'none'}`);
            console.log(`   🔑 Issues: ${parsed.issues?.join(', ') || 'none'}\n`);

            results.push({
                filename,
                id: result.id,
                type: parsed.release_type,
                subtypes: parsed.subtypes,
                issues: parsed.issues,
                confidence: parsed.confidence
            });

            successCount++;

            // Rate limit delay
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`   ❌ Error processing ${filename}:`, error.message, '\n');
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH PARSE COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully parsed: ${successCount}/${spanbergerFiles.length}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n📈 CATEGORIZATION SUMMARY:\n');

    // Generate summary statistics
    const typeCount = {};
    const issueCount = {};
    const subtypeCount = {};

    results.forEach(r => {
        typeCount[r.type] = (typeCount[r.type] || 0) + 1;
        r.issues?.forEach(issue => {
            issueCount[issue] = (issueCount[issue] || 0) + 1;
        });
        r.subtypes?.forEach(subtype => {
            subtypeCount[subtype] = (subtypeCount[subtype] || 0) + 1;
        });
    });

    console.log('Release Types:');
    Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    console.log('\nTop Issues:');
    Object.entries(issueCount).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([issue, count]) => {
        console.log(`  ${issue}: ${count}`);
    });

    console.log('\nTop Subtypes:');
    Object.entries(subtypeCount).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([subtype, count]) => {
        console.log(`  ${subtype}: ${count}`);
    });

    console.log('\n' + '='.repeat(60) + '\n');

    return results;
}

// Run if called directly
if (require.main === module) {
    batchParseAll()
        .then(() => {
            console.log('✅ Batch processing complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Batch processing failed:', error);
            process.exit(1);
        });
}

module.exports = { batchParseAll };

const toneAnalyzer = require('./backend/services/tone-analyzer');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const REVIEW_QUEUE_PATH = path.join(__dirname, 'backend/data/tone-review-queue.json');

const parser = new PressReleaseParser();

async function queueAllReleases() {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('   QUEUING ALL SPANBERGER RELEASES FOR HUMAN REVIEW');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();

    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'backend/data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize queue file
    const queueData = {
        queue: [],
        reviewed: [],
        stats: {
            total: 0,
            approved: 0,
            rejected: 0,
            modified: 0
        }
    };

    // Get all Spanberger files
    const files = fs.readdirSync('./cpo_examples')
        .filter(f => f.startsWith('spanberger_'))
        .sort();

    console.log(`Found ${files.length} Spanberger press releases`);
    console.log();

    for (let i = 0; i < files.length; i++) {
        const filename = files[i];
        const filepath = path.join('./cpo_examples', filename);
        const text = fs.readFileSync(filepath, 'utf8');

        const structure = parser.extractContentStructure(text);
        const bodyText = [structure.lead_paragraph, ...structure.body_paragraphs]
            .filter(p => p.trim().length > 0)
            .join('\n\n');

        console.log(`[${i + 1}/${files.length}] Analyzing ${filename}...`);

        try {
            // Run tone analysis
            const analysis = await toneAnalyzer.analyzeAgainstCampaignProfile(
                text,
                'press_release',
                'default'
            );

            // Add to queue
            const item = {
                id: Date.now().toString() + '_' + i,
                content: text,
                contentType: 'press_release',
                context: 'default',
                analysis: analysis,
                metadata: {
                    filename: filename,
                    headline: structure.headline
                },
                queuedAt: new Date().toISOString(),
                status: 'pending'
            };

            queueData.queue.push(item);
            queueData.stats.total++;

            // Save immediately after each item
            fs.writeFileSync(REVIEW_QUEUE_PATH, JSON.stringify(queueData, null, 2));

            console.log(`  ✓ Queued - ${analysis.alignment} (${analysis.alignmentScore}/100)`);

            // Small delay to avoid rate limiting
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);

            // Still queue it with a basic analysis
            const basicAnalysis = {
                alignment: "ERROR",
                alignmentScore: 50,
                strengths: [],
                gaps: [{
                    area: "analysis",
                    current: "Failed to analyze",
                    target: "Needs manual review",
                    suggestion: "Review this content manually"
                }],
                quickWins: [],
                targetTone: {
                    emotional: "empathetic and determined",
                    rhetorical: "inspire and inform",
                    urgency: "important",
                    audience: "general public"
                },
                profileUsed: "default"
            };

            const item = {
                id: Date.now().toString() + '_' + i,
                content: text,
                contentType: 'press_release',
                context: 'default',
                analysis: basicAnalysis,
                metadata: {
                    filename: filename,
                    headline: structure.headline,
                    error: error.message
                },
                queuedAt: new Date().toISOString(),
                status: 'pending'
            };

            queueData.queue.push(item);
            queueData.stats.total++;

            // Save immediately after each item
            fs.writeFileSync(REVIEW_QUEUE_PATH, JSON.stringify(queueData, null, 2));

            console.log(`  ✓ Queued with error status for manual review`);
        }
    }

    // Save queue
    fs.writeFileSync(REVIEW_QUEUE_PATH, JSON.stringify(queueData, null, 2));

    console.log();
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                           QUEUE CREATED');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();
    console.log(`✅ ${queueData.queue.length} releases added to review queue`);
    console.log();
    console.log('Next steps:');
    console.log('1. Start the server: node server.js');
    console.log('2. Open: http://localhost:3001/tone-review-queue.html');
    console.log('3. Review each release one by one');
    console.log();
    console.log('The system will track:');
    console.log('  - Which AI suggestions you approve');
    console.log('  - Which you reject');
    console.log('  - Which need modifications');
    console.log('  - Overall AI accuracy rate');
    console.log();
}

queueAllReleases().catch(console.error);

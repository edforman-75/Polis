const express = require('express');
const multer = require('multer');
const path = require('path');
const mammoth = require('mammoth');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3002;

// Configure multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
            'text/plain' // .txt
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Word documents and text files are allowed'));
        }
    }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Enhanced cache busting middleware for static files
app.use((req, res, next) => {
    // Add cache busting headers to ALL responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', '');
    res.setHeader('Last-Modified', '');

    // Add timestamp to help with debugging
    res.setHeader('X-Cache-Bust', new Date().toISOString());
    next();
});

app.use(express.static('public', {
    setHeaders: (res, path) => {
        // Extra cache busting for HTML, JS, and CSS files
        if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('ETag', '');
            res.setHeader('Last-Modified', '');
            res.setHeader('X-File-Type', path.split('.').pop());
        }
    }
}));

// Ensure uploads directory exists
(async () => {
    try {
        await fs.mkdir('uploads', { recursive: true });
    } catch (err) {
        console.error('Error creating uploads directory:', err);
    }
})();

// API Routes

// Document upload and analysis endpoint
app.post('/api/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Processing uploaded file:', req.file.originalname);

        let extractedText = '';
        let metadata = {};

        // Extract text based on file type
        if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Handle .docx files
            const result = await mammoth.extractRawText({ path: req.file.path });
            extractedText = result.value;
            metadata.source = 'docx';
        } else if (req.file.mimetype === 'text/plain') {
            // Handle .txt files
            extractedText = await fs.readFile(req.file.path, 'utf8');
            metadata.source = 'txt';
        } else {
            throw new Error('Unsupported file type');
        }

        // Basic text analysis
        const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
        const sentenceCount = extractedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

        metadata = {
            ...metadata,
            filename: req.file.originalname,
            wordCount,
            sentenceCount,
            avgWordsPerSentence: Math.round(wordCount / sentenceCount),
            uploadedAt: new Date().toISOString()
        };

        // Clean up uploaded file
        await fs.unlink(req.file.path);

        // Return the extracted content for analysis
        res.json({
            success: true,
            text: extractedText,
            metadata
        });

    } catch (error) {
        console.error('Upload processing error:', error);
        res.status(500).json({
            error: 'Failed to process uploaded document',
            details: error.message
        });
    }
});

// Analyze document for narrative flow
app.post('/api/analyze/narrative', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        // Import narrative analyzer
        const NarrativeAnalyzer = require('./analyzers/narrative-analyzer');
        const analyzer = new NarrativeAnalyzer();

        const analysis = analyzer.analyze(text);

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Narrative analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze narrative flow',
            details: error.message
        });
    }
});

// Analyze document for AI optimization
app.post('/api/analyze/ai-optimization', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        // Import AI optimization analyzer
        const AIOptimizationAnalyzer = require('./analyzers/ai-optimization-analyzer');
        const analyzer = new AIOptimizationAnalyzer();

        const analysis = analyzer.analyze(text);

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('AI optimization analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze AI optimization',
            details: error.message
        });
    }
});

// Analyze document for compliance and legal issues
app.post('/api/analyze/compliance', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        // Import compliance analyzer
        const ComplianceAnalyzer = require('./analyzers/compliance-analyzer');
        const analyzer = new ComplianceAnalyzer();

        const analysis = analyzer.analyze(text);

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Compliance analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze compliance',
            details: error.message
        });
    }
});

// Analyze document for fact-checking
app.post('/api/analyze/fact-checking', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        // Import fact-checking analyzer
        const FactCheckingAnalyzer = require('./analyzers/fact-checking-analyzer');
        const analyzer = new FactCheckingAnalyzer();

        const analysis = analyzer.analyze(text);

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Fact-checking analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze fact-checking requirements',
            details: error.message
        });
    }
});

// Analyze content fields
app.post('/api/analyze/content-fields', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        // Import content field analyzer
        const ContentFieldAnalyzer = require('./analyzers/content-field-analyzer');
        const analyzer = new ContentFieldAnalyzer();

        const analysis = analyzer.analyze(text);

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Content field analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze content fields',
            details: error.message
        });
    }
});

// Generate unified recommendations
app.post('/api/analyze/recommendations', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        // Run all analyses
        const NarrativeAnalyzer = require('./analyzers/narrative-analyzer');
        const AIOptimizationAnalyzer = require('./analyzers/ai-optimization-analyzer');
        const ComplianceAnalyzer = require('./analyzers/compliance-analyzer');
        const FactCheckingAnalyzer = require('./analyzers/fact-checking-analyzer');
        const ContentFieldAnalyzer = require('./analyzers/content-field-analyzer');
        const RecommendationsEngine = require('./analyzers/recommendations-engine');

        const narrativeAnalyzer = new NarrativeAnalyzer();
        const aiAnalyzer = new AIOptimizationAnalyzer();
        const complianceAnalyzer = new ComplianceAnalyzer();
        const factCheckAnalyzer = new FactCheckingAnalyzer();
        const contentFieldAnalyzer = new ContentFieldAnalyzer();
        const recommendationsEngine = new RecommendationsEngine();

        // Get all analysis results
        const analysisResults = {
            narrative: narrativeAnalyzer.analyze(text),
            aiOptimization: aiAnalyzer.analyze(text),
            compliance: complianceAnalyzer.analyze(text),
            factChecking: factCheckAnalyzer.analyze(text),
            contentFields: contentFieldAnalyzer.analyze(text)
        };

        // Generate unified recommendations
        const recommendations = recommendationsEngine.generateUnifiedRecommendations(analysisResults);

        res.json({
            success: true,
            recommendations,
            analysis_results: analysisResults
        });

    } catch (error) {
        console.error('Recommendations generation error:', error);
        res.status(500).json({
            error: 'Failed to generate recommendations',
            details: error.message
        });
    }
});

// Analyze document for tone
app.post('/api/analyze/tone', async (req, res) => {
    console.log('🎯 TONE ANALYSIS REQUEST RECEIVED');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { text, campaignProfile } = req.body;
        console.log('📝 Text length:', text?.length || 'undefined');
        console.log('🏢 Campaign profile:', campaignProfile ? 'provided' : 'not provided');

        if (!text || text.trim().length < 50) {
            console.log('❌ Text validation failed');
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        console.log('🔄 Clearing require cache for tone analyzer');
        // Clear require cache and import tone analyzer
        delete require.cache[require.resolve('./analyzers/tone-analyzer')];

        console.log('📦 Loading ToneAnalyzer class');
        const ToneAnalyzer = require('./analyzers/tone-analyzer');

        console.log('🏗️ Creating analyzer instance');
        const analyzer = new ToneAnalyzer(campaignProfile);

        console.log('⚡ Starting analysis');
        const analysis = analyzer.analyze(text);

        console.log('✅ Analysis completed successfully');
        console.log('Analysis result keys:', Object.keys(analysis));

        res.json({
            success: true,
            analysis,
            debug: {
                timestamp: new Date().toISOString(),
                textLength: text.length,
                hasProfile: !!campaignProfile
            }
        });

    } catch (error) {
        console.error('❌ TONE ANALYSIS ERROR:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);

        res.status(500).json({
            error: 'Failed to analyze tone',
            details: error.message,
            errorName: error.name,
            stack: error.stack,
            debug: {
                timestamp: new Date().toISOString(),
                endpoint: '/api/analyze/tone'
            }
        });
    }
});

// Analyze document for grammar
app.post('/api/analyze/grammar', async (req, res) => {
    console.log('📝 GRAMMAR ANALYSIS REQUEST RECEIVED');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { text } = req.body;
        console.log('📝 Text length:', text?.length || 'undefined');

        if (!text || text.trim().length < 50) {
            console.log('❌ Grammar text validation failed');
            return res.status(400).json({
                error: 'Text content is required and must be at least 50 characters'
            });
        }

        console.log('🔄 Clearing require cache for grammar analyzer');
        // Clear require cache and import grammar analyzer
        delete require.cache[require.resolve('./analyzers/grammar-analyzer')];

        console.log('📦 Loading GrammarAnalyzer class');
        const GrammarAnalyzer = require('./analyzers/grammar-analyzer');

        console.log('🏗️ Creating grammar analyzer instance');
        const analyzer = new GrammarAnalyzer();

        console.log('⚡ Starting grammar analysis');
        const analysis = analyzer.analyze(text);

        console.log('✅ Grammar analysis completed successfully');
        console.log('Grammar analysis result keys:', Object.keys(analysis));

        res.json({
            success: true,
            analysis,
            debug: {
                timestamp: new Date().toISOString(),
                textLength: text.length
            }
        });

    } catch (error) {
        console.error('❌ GRAMMAR ANALYSIS ERROR:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);

        res.status(500).json({
            error: 'Failed to analyze grammar',
            details: error.message,
            errorName: error.name,
            stack: error.stack,
            debug: {
                timestamp: new Date().toISOString(),
                endpoint: '/api/analyze/grammar'
            }
        });
    }
});

// Setup campaign tone profile
app.post('/api/setup/tone-profile', async (req, res) => {
    try {
        const profileData = req.body;

        // Import tone analyzer for validation
        const ToneAnalyzer = require('./analyzers/tone-analyzer');

        const profile = ToneAnalyzer.createCampaignProfile(profileData);

        res.json({
            success: true,
            profile,
            message: 'Campaign tone profile created successfully'
        });

    } catch (error) {
        console.error('Tone profile setup error:', error);
        res.status(400).json({
            error: 'Failed to create tone profile',
            details: error.message
        });
    }
});

// Get default tone profile structure
app.get('/api/setup/tone-profile/template', (req, res) => {
    res.json({
        success: true,
        template: {
            candidateName: 'Candidate Name',
            communicationStyle: 'balanced', // aggressive, balanced, compassionate, optimistic
            primaryTones: ['professional', 'confident'], // array of tone preferences
            targetAudience: 'general', // general, youth, seniors, professionals, working_class
            formalityLevel: 'formal', // formal, semi-formal, informal
            customKeywords: [], // campaign-specific terms
            avoidWords: [] // words to avoid
        },
        options: {
            communicationStyles: ['aggressive', 'balanced', 'compassionate', 'optimistic'],
            availableTones: ['professional', 'confident', 'optimistic', 'empathetic', 'urgent', 'inclusive'],
            targetAudiences: ['general', 'youth', 'seniors', 'professionals', 'working_class'],
            formalityLevels: ['formal', 'semi-formal', 'informal']
        }
    });
});

// Generate before/after comparison
app.post('/api/compare', async (req, res) => {
    try {
        const { originalText, revisedText } = req.body;

        if (!originalText || !revisedText) {
            return res.status(400).json({
                error: 'Both original and revised text are required'
            });
        }

        // Import comparison generator
        const ComparisonGenerator = require('./utils/comparison-generator');
        const generator = new ComparisonGenerator();

        const comparison = generator.generateComparison(originalText, revisedText);

        res.json({
            success: true,
            comparison
        });

    } catch (error) {
        console.error('Comparison generation error:', error);
        res.status(500).json({
            error: 'Failed to generate comparison',
            details: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Campaign Content Editor'
    });
});

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, 'localhost', () => {
    console.log(`🚀 Campaign Content Editor running on http://localhost:${PORT}`);
    console.log(`📄 Upload and analyze documents for editorial review`);
    console.log(`🔍 Three-surface analysis: Copy, Narrative, AI Optimization`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
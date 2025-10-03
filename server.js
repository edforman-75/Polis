require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./backend/routes/auth');
const contentRoutes = require('./backend/routes/content');
const assignmentRoutes = require('./backend/routes/assignments');
const researchRoutes = require('./backend/routes/research');
const schemaRoutes = require('./backend/routes/schema');
const contentQualityRoutes = require('./backend/routes/content-quality');
const draftGenerationRoutes = require('./backend/routes/draft-generation');
const photoRoutes = require('./backend/routes/photos');
const speechRoutes = require('./backend/routes/speeches');
const politicalContentRoutes = require('./backend/routes/political-content');
const undoRedoRoutes = require('./backend/routes/undo-redo');
const talkingPointsToneRoutes = require('./backend/routes/talking-points-tone');
const briefEnhancementRoutes = require('./backend/routes/brief-enhancement');
const briefQuestionnaireRoutes = require('./backend/routes/brief-questionnaires');
const qualityCheckerRoutes = require('./backend/routes/quality-checker');
const authorizationRoutes = require('./backend/routes/authorization');
const editorialCommentsRoutes = require('./backend/routes/editorial-comments');
const editorialAIRoutes = require('./backend/routes/editorial-ai');
const collaborationRoutes = require('./backend/routes/collaboration');
const pressReleaseTypologyRoutes = require('./backend/routes/press-release-typology');
const pressReleaseParserRoutes = require('./backend/routes/press-release-parser');
const editorAnalysisRoutes = require('./backend/routes/editor-analysis');
const boilerplateRoutes = require('./backend/routes/boilerplate');
const quotesRoutes = require('./backend/routes/quotes');
const textAnalysisRoutes = require('./backend/routes/text-analysis');
const factCheckingRoutes = require('./backend/routes/fact-checking');

// Import database
const db = require('./backend/database/init');

// Import collaboration manager
const collaborationManager = require('./backend/collaboration/manager');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - relaxed for development
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
}));

// CORS configuration for development
app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? function(origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, Postman)
            if (!origin) return callback(null, true);
            // Allow any localhost or 127.0.0.1 on any port
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                return callback(null, true);
            }
            // Allow file:// protocol for local testing
            if (origin.startsWith('file://')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        }
        : process.env.FRONTEND_URL,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10 // limit AI requests to 10 per minute
});

app.use('/api/', limiter);
app.use('/api/research', aiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Disable caching in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        next();
    });
}

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/content-quality', contentQualityRoutes);
app.use('/api/draft-generation', draftGenerationRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/speeches', speechRoutes);
app.use('/api/political-content', politicalContentRoutes);
app.use('/api/undo-redo', undoRedoRoutes);
app.use('/api/talking-points-tone', talkingPointsToneRoutes);
app.use('/api/brief-enhancement', briefEnhancementRoutes);
app.use('/api/brief-questionnaires', briefQuestionnaireRoutes);
app.use('/api/quality-checker', qualityCheckerRoutes);
app.use('/api/authorization', authorizationRoutes);
app.use('/api/editorial-comments', editorialCommentsRoutes);
app.use('/api/editorial-ai', editorialAIRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/press-release-typology', pressReleaseTypologyRoutes);
app.use('/api/press-release-parser', pressReleaseParserRoutes);
app.use('/api/editor', editorAnalysisRoutes);
app.use('/api/boilerplate', boilerplateRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/text-analysis', textAnalysisRoutes);
app.use('/api/fact-checking', factCheckingRoutes);

// Prose enhancement endpoint for editor (no auth required for simplicity)
const aiService = require('./backend/services/ai-service');
app.post('/enhance', async (req, res) => {
    try {
        const { sentence } = req.body;

        if (!sentence || typeof sentence !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid sentence parameter' });
        }

        const prompt = `Improve this sentence for a political campaign press release. Make it more compelling, professional, and impactful while keeping the core message. Return ONLY the improved sentence, nothing else.

Original: "${sentence}"

Improved:`;

        const result = await aiService.performResearch(prompt, {
            contextType: 'prose-enhancement',
            maxTokens: 150
        });

        // Extract just the improved sentence from the response
        let enhanced = result.text.trim();
        // Remove quotes if AI added them
        enhanced = enhanced.replace(/^["']|["']$/g, '');

        res.json({ enhanced });
    } catch (error) {
        console.error('Prose enhancement error:', error);
        res.status(500).json({
            error: 'Enhancement failed',
            enhanced: req.body.sentence // Fallback to original
        });
    }
});

// Parser verification endpoints - List example files
app.get('/api/parser/examples', async (req, res) => {
    try {
        const examplesDir = path.join(__dirname, 'cpo_examples');
        const files = fs.readdirSync(examplesDir)
            .filter(file => file.endsWith('.txt') && !file.endsWith('.json'))
            .sort()
            .map(file => ({
                filename: file,
                displayName: file.replace('.txt', '').replace(/_/g, ' ')
            }));

        res.json({ examples: files });
    } catch (error) {
        console.error('Error listing examples:', error);
        res.status(500).json({ error: 'Failed to list examples' });
    }
});

// Parser verification endpoints - Load specific example file
app.get('/api/parser/examples/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;

        // Security: prevent path traversal
        if (filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(__dirname, 'cpo_examples', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        res.json({
            filename,
            content
        });
    } catch (error) {
        console.error('Error loading example:', error);
        res.status(500).json({ error: 'Failed to load example' });
    }
});

// Save type verification corrections
app.post('/api/parser/type-verification', async (req, res) => {
    try {
        const { filename, detectedType, detectedConfidence, detectedScore, correctedType, subtypes, issues, notes } = req.body;

        if (!filename || !correctedType) {
            return res.status(400).json({ error: 'filename and correctedType are required' });
        }

        // Store in database using existing db connection
        await db.run(`
            INSERT OR REPLACE INTO type_verifications
            (filename, detected_type, detected_confidence, detected_score, corrected_type, subtypes, issues, notes, verified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            filename,
            detectedType || 'UNKNOWN',
            detectedConfidence || 'none',
            detectedScore || 0,
            correctedType,
            JSON.stringify(subtypes || []),
            JSON.stringify(issues || []),
            notes || ''
        ]);

        console.log(`✓ Type verification saved: ${filename} -> ${correctedType} (${(issues || []).length} issues)`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving type verification:', error);
        res.status(500).json({ error: 'Failed to save verification' });
    }
});

// Get saved type verifications
app.get('/api/parser/type-verifications', async (req, res) => {
    try {
        const verifications = await db.all(`
            SELECT filename, detected_type, detected_confidence, detected_score,
                   corrected_type, subtypes, issues, notes, verified_at
            FROM type_verifications
            ORDER BY verified_at DESC
        `);

        // Parse JSON fields
        verifications.forEach(v => {
            v.subtypes = JSON.parse(v.subtypes || '[]');
            v.issues = JSON.parse(v.issues || '[]');
        });

        res.json({ verifications });
    } catch (error) {
        console.error('Error loading verifications:', error);
        res.status(500).json({ error: 'Failed to load verifications' });
    }
});

// Serve static files in development
if (process.env.NODE_ENV === 'development') {
    // Add cache-busting middleware for development
    app.use((req, res, next) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        next();
    });

    app.use(express.static(path.join(__dirname, 'public')));

    // Serve the main editor with no-cache headers
    app.get('/', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'notion-style-campaign-editor.html'));
    });

    // Serve the dashboard with no-cache headers
    app.get('/dashboard', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'assignment-dashboard.html'));
    });

    // Serve the writers dashboard (thin client)
    app.get('/writers', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'writers-dashboard-thin.html'));
    });

    // Serve the communications director dashboard
    app.get('/director', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'communications-director-dashboard.html'));
    });

    // Serve the communications director dashboard (thin client)
    app.get('/director-thin', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'communications-director-thin.html'));
    });

    // Serve the social media editor
    app.get('/social', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'social-media-editor.html'));
    });

    // Serve the photo library
    app.get('/photos', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'photo-library.html'));
    });

    // Serve the thin speech editor
    app.get('/speech-editor-thin', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'speech-editor-thin.html'));
    });

    // Serve the op-ed editor
    app.get('/op-ed', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'op-ed-editor.html'));
    });

    // Serve the press release editor
    app.get('/press-release', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'press-release-editor.html'));
    });

    // Serve the multi-surface press release canvas
    app.get('/press-release-canvas', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'press-release-canvas.html'));
    });

    // Serve the press release briefing workflow
    app.get('/press-release-briefing', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'press-release-briefing.html'));
    });

    // Serve the talking points editor
    app.get('/talking-points', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'talking-points-editor.html'));
    });

    // Serve the research director dashboard
    app.get('/research', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'research-director-dashboard.html'));
    });

    // Serve the press secretary dashboard
    app.get('/press-secretary', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'press-secretary-dashboard.html'));
    });

    // Serve the editorial canvas
    app.get('/editor', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'editorial-canvas.html'));
    });

    // Serve the senior writer dashboard
    app.get('/senior-writer', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'senior-writer-dashboard.html'));
    });

    // Serve the digital director dashboard
    app.get('/digital-director', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'public', 'digital-director-dashboard.html'));
    });

    // Handle direct assignment URLs and redirect to appropriate editor
    app.get('/assignment-:assignmentId', (req, res) => {
        const assignmentId = req.params.assignmentId;

        // Route based on assignment ID patterns
        if (assignmentId.startsWith('EDU') || assignmentId.includes('op-ed') || assignmentId.includes('opinion')) {
            res.redirect(`/op-ed?assignment=${assignmentId}`);
        } else if (assignmentId.startsWith('INF') || assignmentId.startsWith('VDB-2025-008') || assignmentId.includes('press-release')) {
            res.redirect(`/press-release?assignment=${assignmentId}`);
        } else if (assignmentId.startsWith('VSM') || assignmentId.startsWith('SOC') || assignmentId.includes('social')) {
            res.redirect(`/social?assignment=${assignmentId}`);
        } else if (assignmentId.startsWith('HCS') || assignmentId.startsWith('VDB-2025-007') || assignmentId.startsWith('SPE') || assignmentId.includes('speech')) {
            res.redirect(`/speech-editor-thin?assignment=${assignmentId}`);
        } else if (assignmentId.startsWith('TP') || assignmentId.startsWith('TKP') || assignmentId.includes('talking-points')) {
            res.redirect(`/talking-points?assignment=${assignmentId}`);
        } else {
            // Default to main editor for letters, emails, etc.
            res.redirect(`/?assignment=${assignmentId}`);
        }
    });

    // CPO Portal Routes
    // Serve CPO portal index
    app.get('/cpo', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'cpo_docs', 'index.html'));
    });

    // Serve CPO documentation files (HTML and CSS)
    app.use('/cpo/docs', express.static(path.join(__dirname, 'cpo_docs'), {
        setHeaders: (res) => {
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
        }
    }));

    // Serve CPO tool HTML files
    app.use('/cpo/tools', express.static(path.join(__dirname, 'cpo_docs'), {
        setHeaders: (res) => {
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
        }
    }));

    // Serve CPO templates (JSON-LD files)
    app.use('/cpo/templates', express.static(path.join(__dirname, 'cpo_templates'), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.jsonld')) {
                res.set('Content-Type', 'application/ld+json');
            }
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
        }
    }));

    // Serve CPO examples (JSON-LD files)
    app.use('/cpo/examples', express.static(path.join(__dirname, 'cpo_examples'), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.jsonld')) {
                res.set('Content-Type', 'application/ld+json');
            }
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
        }
    }));
} else {
    // Production mode - serve static files with caching
    app.use(express.static(path.join(__dirname, 'public'), {
        maxAge: '1h',
        etag: true
    }));
}

// Documentation routes - serve markdown files
app.get('/api/docs/prd', (req, res) => {
    const filePath = path.join(__dirname, 'PRD-Campaign-AI-Editor.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

app.get('/api/docs/user-guide', (req, res) => {
    const filePath = path.join(__dirname, 'USER_GUIDE.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

app.get('/api/docs/technical', (req, res) => {
    const filePath = path.join(__dirname, 'TECHNICAL_DOCS.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

app.get('/api/docs/design-patterns', (req, res) => {
    const filePath = path.join(__dirname, 'DESIGN_PATTERNS.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

// Training data routes
app.get('/api/training-data/dataset', (req, res) => {
    const filePath = path.join(__dirname, 'training_data', 'press_release_training_dataset.csv');
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="press_release_training_dataset.csv"');
    res.sendFile(filePath);
});

app.get('/api/training-data/rubric', (req, res) => {
    const filePath = path.join(__dirname, 'training_data', 'press_release_quality_rubric.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

app.get('/api/training-data/definitions', (req, res) => {
    const filePath = path.join(__dirname, 'training_data', 'press_release_quality_definitions.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

app.get('/api/training-data/readme', (req, res) => {
    const filePath = path.join(__dirname, 'training_data', 'README_TRAINING.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

// Test data routes
app.get('/api/test-data/adversarial', (req, res) => {
    const filePath = path.join(__dirname, 'test_data', 'adversarial_mismatch_dataset.csv');
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="adversarial_mismatch_dataset.csv"');
    res.sendFile(filePath);
});

app.get('/api/test-data/readme', (req, res) => {
    const filePath = path.join(__dirname, 'test_data', 'README_ADVERSARIAL.md');
    res.set('Content-Type', 'text/markdown');
    res.sendFile(filePath);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error'
    });
});

// Initialize database and start server
db.initialize().then(async () => {
    // Initialize parser feedback service tables
    const feedbackService = require('./backend/services/parser-feedback-service');
    await feedbackService.initializeDatabase();

    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 Main Editor available at http://localhost:${PORT}/`);
        console.log(`📊 Assignment Dashboard at http://localhost:${PORT}/dashboard`);
        console.log(`👥 Writers Dashboard at http://localhost:${PORT}/writers`);
        console.log(`📺 Communications Director at http://localhost:${PORT}/director`);
        console.log(`📰 Press Secretary at http://localhost:${PORT}/press-secretary`);
        console.log(`🔬 Research Director at http://localhost:${PORT}/research`);
        console.log(`🏆 Campaign Manager at http://localhost:${PORT}/campaign-manager`);
        console.log(`✍️ Senior Writer at http://localhost:${PORT}/senior-writer`);
        console.log(`📱 Digital Director at http://localhost:${PORT}/digital-director`);
        console.log(`🎨 Editorial Canvas at http://localhost:${PORT}/editor`);
        console.log(`📰 Op-Ed Editor at http://localhost:${PORT}/op-ed`);
        console.log(`📄 Press Release Editor at http://localhost:${PORT}/press-release`);
        console.log(`🎤 Speech Editor at http://localhost:${PORT}/speech-editor-thin`);
        console.log(`📱 Social Media Editor at http://localhost:${PORT}/social`);
        console.log(`💬 Talking Points Editor at http://localhost:${PORT}/talking-points`);
        console.log(`📸 Photo Library at http://localhost:${PORT}/photos`);
        console.log(`🏢 CPO Portal at http://localhost:${PORT}/cpo`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

        // Initialize collaboration manager
        collaborationManager.initialize(server);
        console.log(`🔗 Collaborative editing available on WebSocket port 8080`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
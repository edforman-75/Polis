require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');

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

// Import database
const db = require('./backend/database/init');

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
        ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://']
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

    app.use(express.static(path.join(__dirname)));

    // Serve the main editor with no-cache headers
    app.get('/', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'notion-style-campaign-editor.html'));
    });

    // Serve the dashboard with no-cache headers
    app.get('/dashboard', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'assignment-dashboard.html'));
    });

    // Serve the writers dashboard (thin client)
    app.get('/writers', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'writers-dashboard-thin.html'));
    });

    // Serve the communications director dashboard
    app.get('/director', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'communications-director-dashboard.html'));
    });

    // Serve the communications director dashboard (thin client)
    app.get('/director-thin', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'communications-director-thin.html'));
    });

    // Serve the social media editor
    app.get('/social', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'social-media-editor.html'));
    });

    // Serve the photo library
    app.get('/photos', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'photo-library.html'));
    });

    // Serve the thin speech editor
    app.get('/speech-editor-thin', (req, res) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.sendFile(path.join(__dirname, 'speech-editor-thin.html'));
    });
}

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
db.initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 Editor available at http://localhost:${PORT}/`);
        console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard`);
        console.log(`📱 Social Media Editor at http://localhost:${PORT}/social`);
        console.log(`📸 Photo Library at http://localhost:${PORT}/photos`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
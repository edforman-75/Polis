# Campaign Content Editor

Advanced political campaign content editor with AI-powered document type detection and recommendations.

## Features

### 🎯 Document Type Detection
- **Press Releases** (campaign announcements, endorsements, statements)
- **Speeches** and remarks
- **Emails** and letters
- **Social Media** posts
- **General** articles and content

### 🔧 Press Release Features
- Automatic header formatting (removes "PRESS RELEASES", adds proper spacing)
- Em dash attribution formatting for proper press release style
- Stronger action verb recommendations (announce → declare)
- Campaign-specific content suggestions

### 📊 Advanced Analysis
- Real-time tone analysis and scoring
- Dynamic text highlighting with scroll-to-center
- Full sentence context with bold target words
- Double-click to apply suggestions
- Sequential recommendation workflow
- Dynamic re-analysis after each edit

### 🎨 User Interface
- Split-screen editor with live preview
- Collapsible recommendation cards
- Progress tracking with visual indicators
- Comprehensive scoring system (14% → up to 100%)
- Cache-busted development workflow

## Structure

```
campaign-editor/
├── frontend/
│   └── public/
│       └── enhanced-recommendations-clean.html  # Main editor interface
├── backend/
│   ├── server.js                               # Express server
│   ├── analyzers/                              # Analysis engines
│   │   ├── tone-analyzer.js                   # Tone analysis
│   │   ├── grammar-analyzer.js                # Grammar checking
│   │   └── recommendations-engine.js          # Recommendation generation
│   └── utils/                                 # Utility functions
├── tests/                                     # Test files
└── docs/                                      # Documentation
```

## Installation

```bash
cd campaign-editor/backend
npm install
PORT=3002 node server.js
```

## Usage

1. Navigate to `http://localhost:3002/enhanced-recommendations-clean.html`
2. Click "Load Sample" to load test content
3. Click "Analyze Tone" to begin analysis
4. Review recommendations and apply changes
5. Score improves as recommendations are applied

## Document-Specific Rules

### Press Releases
- **Header Formatting**: Proper spacing between date, headline, location
- **Attribution Style**: Em dashes before location (HENRICO, Va. —)
- **Action Verbs**: Stronger verbs (announce → declare, said → declared)
- **Structure**: Professional press release formatting standards

### Future Document Types
The system is extensible to support:
- Speech transcripts with applause cues
- Email templates with subject line optimization
- Social media posts with character limits
- Formal letters with proper salutations

## Technical Features

- **Node.js** Express server with comprehensive API
- **Document Type Detection** using pattern matching
- **Rule Engine** for document-specific recommendations
- **Visual Highlighting** with word boundary matching
- **State Management** for progress tracking
- **Dynamic Re-analysis** after each edit
- **Cache Busting** for development workflow

## Contributing

This is part of the larger Polis political technology platform. The campaign content editor operates as an independent module with its own server and frontend.
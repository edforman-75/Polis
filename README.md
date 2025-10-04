# 🏛️ Campaign AI Editor - Professional Political Communications Platform

A comprehensive AI-powered campaign communications platform that transforms basic content creation into professional-grade political campaign workflows with strategic briefing systems, multi-stage review processes, and AI-enhanced quality control.

## 🚀 Features

### ✨ Professional Campaign Briefing System
- **Strategic Framework Analysis**: Primary message development, supporting points, strategic purpose alignment
- **Professional Templates**: 7 specialized templates (Healthcare Policy, Crisis Response, Endorsement, Debate Prep, Press Conference, Town Hall, Policy Brief)
- **AI-Powered Enhancement**: Strategic analysis, content requirements generation, quality scoring
- **Multi-Stage Review Workflow**: Initial → Content Review → Legal Review → Final Approval

### 📋 Content Types Supported
- **Speech Writing**: Professional speechwriting with tone analysis and strategic messaging
- **Press Releases**: AP-style press releases with news value optimization
- **Social Media Content**: Platform-specific optimization and scheduling
- **Policy Briefs**: Comprehensive policy analysis with stakeholder mapping
- **Communications Briefs**: Strategic messaging frameworks for surrogates and staff
- **Crisis Response**: Rapid-deployment crisis communications templates

### 🤖 AI-Powered Intelligence
- **Strategic Messaging Analysis**: Evaluate message effectiveness and political appeal
- **Content Requirements Generation**: Automated professional checklists
- **Configurable Tone Analysis**: Campaign-specific tone profiles with AI-powered alignment checking
- **Real-Time Tone Feedback**: Instant analysis against campaign's strategic tone requirements
- **Human Review Queue**: Verify AI suggestions with structured approve/reject/modify workflow
- **Opposition Research Integration**: Defensive messaging and vulnerability analysis
- **Quality Control**: Automated brief scoring and improvement recommendations

### 🎯 Professional Workflows
- **Assignment Management**: Task routing with priority levels and deadline tracking
- **Dashboard Views**: Role-based dashboards for Communications Directors, Writers, and Media teams
- **Template-Driven Creation**: Professional templates guide content creation
- **Review & Approval**: Multi-stage review with version control
- **Resource Management**: Background materials, research integration, and file attachments

## 🏗️ Architecture

### Backend Services
- **Brief Enhancement Analyzer** (`backend/services/brief-enhancement-analyzer.js`)
  - Strategic framework analysis
  - Content requirements generation
  - Policy-specific analysis
  - Event context evaluation

- **AI Service Integration** (`backend/services/ai-service.js`)
  - OpenAI GPT integration
  - Fallback systems for reliability
  - Custom prompt engineering for political content

- **Specialized Processors**
  - Speech processor with tone analysis
  - Press release processor with AP-style optimization
  - Social media processor with platform-specific features
  - Policy processor with stakeholder analysis

### Frontend Applications
- **Communications Director Dashboard** - Strategic oversight and brief management
- **Writer Dashboard** - Content creation with AI assistance
- **Social Media Editor** - Platform-specific content optimization
- **Speech Editor** - Professional speechwriting tools
- **Assignment Dashboard** - Project management and workflow

### Database & Storage
- **SQLite Database** - Local development and testing
- **Structured Data Storage** - Professional brief templates and content requirements
- **Session Management** - User authentication and role-based access

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn package manager

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd campaign-ai-editor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your OpenAI API key and other configurations

# Initialize database
npm run setup-db

# Start development server
npm run dev
```

### Environment Configuration
```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7

# Database Configuration
DATABASE_URL=./campaign.db

# Server Configuration
PORT=3001
NODE_ENV=development

# Session Security
SESSION_SECRET=your_secure_session_secret
```

## 📖 Usage

### Creating Professional Briefs

1. **Access Communications Director Dashboard**
   ```
   http://localhost:3001/director
   ```

2. **Create New Brief**
   - Click "Create New Brief"
   - Select template type (Healthcare Policy, Crisis Response, etc.)
   - Set priority level and assign to writer
   - AI will generate strategic framework and content requirements

3. **Enhanced Brief Editor**
   - **Header Tab**: Basic information and priority settings
   - **Strategic Framework**: Primary message, supporting points, strategic purpose
   - **Event Context**: What/When/Where/Who/Why framework
   - **Content Requirements**: Must-include elements, defensive points, call-to-action
   - **AI Enhancement**: Strategic analysis and quality improvement

### Writer Workflow

1. **Access Writer Dashboard**
   ```
   http://localhost:3001/writers
   ```

2. **Receive Brief Assignment**
   - Brief appears with complete strategic framework
   - AI-generated content requirements and checklists
   - Professional templates guide content creation

3. **Content Creation**
   - Use appropriate editor (Speech, Social Media, Press Release)
   - AI-powered writing assistance and tone optimization
   - Real-time quality feedback and suggestions

### API Endpoints

#### Brief Enhancement API
```javascript
// Analyze brief strategically
POST /api/brief-enhancement/analyze-brief
{
  "briefData": {
    "title": "Healthcare Policy Speech",
    "description": "Announce affordability plan",
    "audience": "Healthcare workers",
    "tone": "Empathetic but determined"
  }
}

// Generate content requirements
POST /api/brief-enhancement/generate-content-requirements

// Get available templates
GET /api/brief-enhancement/available-templates

// Score brief quality
POST /api/brief-enhancement/score-brief-quality
```

#### Tone Analysis API
```javascript
// Real-time tone analysis against campaign profile
POST /api/tone-check
{
  "content": "Your press release or speech text",
  "contentType": "press_release",
  "context": "default"
}

// Get tone configuration options
GET /api/tone-check/options

// Queue content for human review
POST /api/tone-review/queue
{
  "content": "Content to review",
  "contentType": "press_release",
  "context": "default",
  "analysis": { /* AI analysis results */ }
}

// Get next item from review queue
GET /api/tone-review/next

// Submit review decision
POST /api/tone-review/decision
{
  "itemId": "review_item_id",
  "decision": "approve|reject|modify",
  "feedback": "Optional feedback",
  "modifications": { /* corrections if needed */ }
}

// Get review queue statistics
GET /api/tone-review/stats
```

#### Tone Settings API
```javascript
// Get current tone settings
GET /api/tone-settings

// Get active tone profile
GET /api/tone-settings/active

// Get available tone profiles
GET /api/tone-settings/profiles

// Update campaign tone settings
POST /api/tone-settings
{
  "enabled": true,
  "useProfile": "concerned_protector",
  "contentTypes": { /* custom tone by content type */ }
}

// Apply a pre-built tone profile
POST /api/tone-settings/apply-profile
{ "profileName": "progressive_fighter" }

// Reset to default settings
POST /api/tone-settings/reset
```

## 🎨 Campaign Tone Analysis System

### Configurable Tone Profiles
The system includes pre-built tone profiles that campaigns can adopt based on their strategic positioning:

- **Progressive Fighter** - Bold, urgent advocacy for transformative change
- **Pragmatic Problem-Solver** - Results-focused, bipartisan collaboration emphasis
- **Empathetic Listener** - Community-focused, constituent stories, personal connection
- **Experienced Leader** - Proven record, steady leadership, informed reassurance
- **Concerned Protector** - Constituent defense, critical of harmful policies, responsive to threats

### Real-Time Tone Checking
**Demo Interface**: `http://localhost:3001/tone-check-demo.html`

Writers can paste content and get instant AI feedback on:
- **Alignment Score** (0-100) against campaign's strategic tone
- **Strengths** - What's working well tonally
- **Gaps** - Specific areas needing adjustment
- **Quick Wins** - Easy improvements for better alignment
- **Rewrite Suggestions** - AI-generated alternative phrasings

### Human Review Queue
**Review Interface**: `http://localhost:3001/tone-review-queue.html`

AI suggestions require human verification to ensure accuracy:
- **Queue Management** - All AI analyses can be queued for staff review
- **Review Decisions** - Approve (accurate) / Reject (wrong) / Modify (needs correction)
- **Accuracy Tracking** - Monitor AI performance over time
- **Feedback Loop** - Human decisions improve future AI suggestions

### Tone Configuration
**Settings**: `backend/config/tone-settings.json`

Campaigns can customize tone requirements by:
- **Content Type** - Different tones for press releases vs social media vs speeches
- **Context** - Attacking opponents vs defending record vs announcing policy
- **Emotional Dimension** - Empathetic, determined, concerned, optimistic, etc.
- **Rhetorical Approach** - Inspire, critique, inform, advocate, reassure
- **Urgency Level** - Crisis, highly important, important, routine
- **Target Audience** - General public, specific constituencies, media, donors

## 🎯 Professional Standards Alignment

### Strategic Framework ✅
- **Primary Message**: Single memorable takeaway
- **Supporting Messages**: 2-3 strategic reinforcing points
- **Strategic Purpose**: Campaign goal alignment
- **Audience Analysis**: Target-specific messaging

### Content Requirements ✅
- **Must-Include Elements**: Candidate credentials, policy positions, statistics
- **Local Connections**: Community-specific references
- **Defensive Elements**: Proactive vulnerability addressing
- **Call-to-Action**: Primary and secondary actions

### Review Workflow ✅
- **Multi-Stage Process**: Initial → Content → Legal → Final
- **Quality Control**: Automated scoring and manual review
- **Version Control**: Track changes and approvals
- **Compliance**: FEC and legal requirement checks

## 🤖 AI Enhancement Details

### Strategic Analysis
- **Message Effectiveness**: Score messaging for political impact
- **Audience Targeting**: Optimize for specific voter segments
- **Vulnerability Assessment**: Identify potential attack vectors
- **Competitive Analysis**: Position against opponent messaging

### Content Generation
- **Professional Checklists**: Automated requirement generation
- **Template Customization**: AI-adapted professional templates
- **Quality Scoring**: Objective completeness assessment
- **Improvement Suggestions**: Expert-level recommendations

### Policy Brief Analysis
- **Stakeholder Mapping**: Support/opposition analysis
- **Implementation Planning**: Phased rollout strategies
- **Political Timing**: Optimal release windows
- **Messaging Strategy**: Audience-specific framing

## 📊 System Benefits

### For Communications Directors
- **Professional Standards**: Match real-world campaign practices
- **Strategic Oversight**: Complete brief management and quality control
- **Efficiency Gains**: Template-driven workflows reduce briefing time
- **Quality Assurance**: AI-powered analysis improves strategic messaging

### For Writers
- **Clear Direction**: Comprehensive briefs with strategic framework
- **AI Assistance**: Writing support with political expertise
- **Quality Feedback**: Real-time improvement suggestions
- **Template Guidance**: Professional structures guide content creation

### For Campaigns
- **Message Discipline**: Consistent strategic messaging across all content
- **Professional Quality**: Campaign communications match industry standards
- **Rapid Response**: Crisis communication templates enable quick deployment
- **Scalable Operations**: Support growing teams with systematic workflows

## 🔧 Technical Implementation

### Key Files
- `server.js` - Main application server with route configuration
- `backend/services/brief-enhancement-analyzer.js` - Core AI analysis service
- `backend/services/tone-analyzer.js` - Campaign tone analysis with profile alignment
- `backend/routes/brief-enhancement.js` - Enhanced briefing API endpoints
- `backend/routes/tone-check.js` - Real-time tone checking API
- `backend/routes/tone-review.js` - Human review queue management API
- `backend/routes/tone-settings.js` - Tone configuration API
- `backend/config/tone-settings.json` - Campaign tone profile definitions
- `public/tone-check-demo.html` - Real-time tone checker interface
- `public/tone-review-queue.html` - Human verification queue interface
- `communications-director-dashboard.html` - Professional dashboard interface

### Database Schema
- **assignments** - Task management and workflow tracking
- **communications_briefs** - Professional brief storage with structured data
- **speeches** - Speech content with AI analysis metadata
- **policy_documents** - Policy briefs with stakeholder analysis
- **social_posts** - Social media content with platform optimization

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build application
npm run build

# Start production server
npm start
```

### Environment Variables
Ensure all required environment variables are configured for your deployment platform.

## 🤝 Contributing

This project follows professional political campaign communication standards. When contributing:

1. **Maintain Professional Standards**: All features should match real-world campaign practices
2. **AI Enhancement**: Leverage AI to improve quality while maintaining human oversight
3. **Security First**: Political communications require strong security practices
4. **Documentation**: Update documentation for new features and workflows

## 📄 License

This project is intended for legitimate political campaign use. Please ensure compliance with all applicable campaign finance and communications regulations.

## 🎖️ Generated with Claude Code

This professional campaign communications platform was enhanced with AI-powered briefing systems and strategic analysis capabilities.

**Co-Authored-By: Claude <noreply@anthropic.com>**

---

*Transform your campaign communications from basic content creation to professional-grade strategic messaging with AI-enhanced quality and industry-standard workflows.*
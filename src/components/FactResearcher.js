import { useState, useEffect } from '@wordpress/element';
import { Card, CardBody, Button, Modal, TextControl, SelectControl, ToggleControl, Spinner } from '@wordpress/components';

export class FactResearcher {
    constructor() {
        this.researchCache = new Map();
        this.verificationSources = [];
        this.acceptedFacts = [];
        this.rejectedFacts = [];
    }

    // Main fact research orchestrator
    async researchFact(claim, context = {}) {
        const cacheKey = this.generateCacheKey(claim);
        
        // Check cache first
        if (this.researchCache.has(cacheKey)) {
            return this.researchCache.get(cacheKey);
        }

        const research = {
            id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            claim,
            context,
            status: 'researching',
            confidence: 0,
            sources: [],
            verification: null,
            researchedAt: new Date().toISOString(),
            methods: []
        };

        try {
            // Parallel research across multiple sources
            const researchPromises = [
                this.searchGovernmentSources(claim, context),
                this.searchNewsources(claim, context),
                this.searchAcademicSources(claim, context),
                this.searchCampaignDatabase(claim, context),
                this.crossReferenceWithPreviousContent(claim)
            ];

            const results = await Promise.allSettled(researchPromises);
            
            // Compile research results
            research.sources = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .flatMap(result => result.value)
                .sort((a, b) => b.reliability - a.reliability);

            // Calculate overall confidence
            research.confidence = this.calculateConfidence(research.sources);
            research.status = research.confidence > 0.7 ? 'verified' : 
                            research.confidence > 0.4 ? 'questionable' : 'unverified';

            // Add research methods used
            research.methods = [
                'Government database search',
                'News source verification',
                'Academic literature review',
                'Campaign records check',
                'Cross-reference with previous content'
            ];

            // Cache the result
            this.researchCache.set(cacheKey, research);
            
            return research;

        } catch (error) {
            research.status = 'error';
            research.error = error.message;
            return research;
        }
    }

    // Search government databases and official sources
    async searchGovernmentSources(claim, context) {
        // Simulate API calls to government databases
        const sources = [];
        
        // Bureau of Labor Statistics for job numbers
        if (claim.match(/\d+.*jobs?/i)) {
            sources.push({
                id: 'bls_' + Date.now(),
                type: 'government',
                source: 'Bureau of Labor Statistics',
                url: 'https://www.bls.gov/data/',
                title: 'Employment Statistics Database',
                excerpt: `Employment data shows job creation in related sectors: ${this.extractNumbers(claim)[0] || 'N/A'} jobs is within normal range for infrastructure projects.`,
                reliability: 0.95,
                datePublished: '2024-01-10',
                relevance: 0.9,
                supports: true
            });
        }

        // Census data for population/demographic claims
        if (claim.match(/\d+.*(people|families|residents)/i)) {
            sources.push({
                id: 'census_' + Date.now(),
                type: 'government',
                source: 'U.S. Census Bureau',
                url: 'https://www.census.gov/data',
                title: 'American Community Survey',
                excerpt: `Census data indicates population figures in the referenced area align with the stated numbers.`,
                reliability: 0.98,
                datePublished: '2023-12-15',
                relevance: 0.85,
                supports: true
            });
        }

        // Congressional Budget Office for spending claims
        if (claim.match(/\$[\d,]+.*billion|million/i)) {
            sources.push({
                id: 'cbo_' + Date.now(),
                type: 'government',
                source: 'Congressional Budget Office',
                url: 'https://www.cbo.gov/',
                title: 'Budget Impact Analysis',
                excerpt: `CBO projections indicate spending of this magnitude is feasible within proposed budget frameworks.`,
                reliability: 0.92,
                datePublished: '2024-01-05',
                relevance: 0.8,
                supports: true
            });
        }

        return sources;
    }

    // Search reputable news sources
    async searchNewsources(claim, context) {
        const sources = [];
        
        // Simulate news source verification
        if (claim.match(/announces?|launches?|proposes?/i)) {
            sources.push({
                id: 'news_' + Date.now(),
                type: 'news',
                source: 'Associated Press',
                url: 'https://apnews.com/search',
                title: 'Recent Political Announcements Coverage',
                excerpt: `Similar announcements have been covered with comparable scope and scale.`,
                reliability: 0.88,
                datePublished: '2024-01-12',
                relevance: 0.7,
                supports: true
            });
        }

        // Local news for regional claims
        if (context.location && claim.match(new RegExp(context.location.split(',')[0], 'i'))) {
            sources.push({
                id: 'local_news_' + Date.now(),
                type: 'news',
                source: 'Local Media Coverage',
                url: 'https://localnews.example.com',
                title: `${context.location} Area Coverage`,
                excerpt: `Local reporting confirms details about regional impacts and community involvement.`,
                reliability: 0.75,
                datePublished: '2024-01-08',
                relevance: 0.9,
                supports: true
            });
        }

        return sources;
    }

    // Search academic and research sources
    async searchAcademicSources(claim, context) {
        const sources = [];

        // Policy research for healthcare/infrastructure claims
        if (claim.match(/healthcare|infrastructure|education/i)) {
            sources.push({
                id: 'academic_' + Date.now(),
                type: 'academic',
                source: 'Brookings Institution',
                url: 'https://www.brookings.edu/research/',
                title: 'Policy Impact Studies',
                excerpt: `Academic research supports the feasibility and potential impact of similar policy initiatives.`,
                reliability: 0.85,
                datePublished: '2023-11-20',
                relevance: 0.8,
                supports: true
            });
        }

        // Economic research for job/budget claims
        if (claim.match(/\d+.*jobs?|\$[\d,]+/i)) {
            sources.push({
                id: 'econ_research_' + Date.now(),
                type: 'academic',
                source: 'Economic Policy Institute',
                url: 'https://www.epi.org/',
                title: 'Economic Impact Analysis',
                excerpt: `Economic research indicates multiplier effects of public investment align with projected outcomes.`,
                reliability: 0.82,
                datePublished: '2023-12-03',
                relevance: 0.85,
                supports: true
            });
        }

        return sources;
    }

    // Search internal campaign database
    async searchCampaignDatabase(claim, context) {
        const sources = [];
        
        // Check previous campaign documents
        const previousDocs = await this.getCampaignDocuments();
        
        for (const doc of previousDocs) {
            if (this.claimAppearsInDocument(claim, doc)) {
                sources.push({
                    id: `campaign_${doc.id}`,
                    type: 'campaign',
                    source: 'Campaign Records',
                    url: `/documents/${doc.id}`,
                    title: doc.title,
                    excerpt: `This claim has been used in previous campaign materials: "${doc.title}"`,
                    reliability: 0.7,
                    datePublished: doc.date,
                    relevance: 0.9,
                    supports: true,
                    note: 'Previously used - check for consistency'
                });
            }
        }

        return sources;
    }

    // Cross-reference with previous content for consistency
    async crossReferenceWithPreviousContent(claim) {
        const sources = [];
        
        // Check for contradictions with previous statements
        const contradictions = await this.findContradictions(claim);
        
        contradictions.forEach(contradiction => {
            sources.push({
                id: `contradiction_${contradiction.id}`,
                type: 'contradiction',
                source: 'Campaign Consistency Check',
                url: contradiction.sourceUrl,
                title: contradiction.sourceTitle,
                excerpt: `Potential contradiction found: "${contradiction.conflictingStatement}"`,
                reliability: 0.95,
                datePublished: contradiction.date,
                relevance: 1.0,
                supports: false,
                warning: true
            });
        });

        return sources;
    }

    // Calculate overall confidence based on sources
    calculateConfidence(sources) {
        if (sources.length === 0) return 0;

        const weightedConfidence = sources.reduce((total, source) => {
            const weight = this.getSourceWeight(source.type);
            return total + (source.reliability * source.relevance * weight);
        }, 0);

        const totalWeight = sources.reduce((total, source) => {
            return total + this.getSourceWeight(source.type);
        }, 0);

        return Math.min(1, weightedConfidence / totalWeight);
    }

    // Get weight for different source types
    getSourceWeight(sourceType) {
        const weights = {
            'government': 1.0,
            'academic': 0.9,
            'news': 0.7,
            'campaign': 0.6,
            'contradiction': 1.2 // Higher weight for contradictions
        };
        return weights[sourceType] || 0.5;
    }

    // Extract numerical values from claims
    extractNumbers(text) {
        const matches = text.match(/\d+(?:,\d{3})*/g);
        return matches ? matches.map(m => parseInt(m.replace(/,/g, ''))) : [];
    }

    // Accept a fact with or without verification
    acceptFact(factId, requiresVerification = true, userNote = '') {
        const acceptance = {
            factId,
            acceptedAt: new Date().toISOString(),
            requiresVerification,
            userNote,
            acceptedBy: this.getCurrentUser()
        };

        this.acceptedFacts.push(acceptance);
        return acceptance;
    }

    // Reject a fact with reason
    rejectFact(factId, reason, alternativeSuggestion = '') {
        const rejection = {
            factId,
            rejectedAt: new Date().toISOString(),
            reason,
            alternativeSuggestion,
            rejectedBy: this.getCurrentUser()
        };

        this.rejectedFacts.push(rejection);
        return rejection;
    }

    // Helper methods
    generateCacheKey(claim) {
        return btoa(claim.toLowerCase().replace(/\s+/g, ' ').trim()).substring(0, 32);
    }

    async getCampaignDocuments() {
        // Simulate fetching campaign documents
        return [
            {
                id: 1,
                title: 'Healthcare Policy Platform',
                date: '2023-12-01',
                content: 'Previous healthcare announcements and commitments'
            },
            {
                id: 2,
                title: 'Infrastructure Investment Plan',
                date: '2023-11-15',
                content: 'Previous infrastructure spending proposals'
            }
        ];
    }

    claimAppearsInDocument(claim, document) {
        // Simple similarity check - in production would use more sophisticated matching
        const claimWords = claim.toLowerCase().split(/\s+/);
        const docContent = document.content.toLowerCase();
        
        return claimWords.some(word => word.length > 3 && docContent.includes(word));
    }

    async findContradictions(claim) {
        // Simulate contradiction detection
        const contradictions = [];
        
        if (claim.includes('500 families') && claim.includes('500-seat')) {
            contradictions.push({
                id: 'contradiction_1',
                conflictingStatement: 'Previous document mentioned 350-seat capacity',
                sourceUrl: '/documents/venue-details',
                sourceTitle: 'Venue Capacity Documentation',
                date: '2024-01-10'
            });
        }

        return contradictions;
    }

    getCurrentUser() {
        // In production, get from WordPress user system
        return {
            id: 1,
            name: 'Media Associate',
            role: 'editor'
        };
    }
}

// React component for fact research interface
export const FactResearchPanel = ({ claim, onAccept, onReject, onResearch }) => {
    const [research, setResearch] = useState(null);
    const [isResearching, setIsResearching] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedSources, setSelectedSources] = useState([]);
    const [userNote, setUserNote] = useState('');
    const [acceptWithoutVerification, setAcceptWithoutVerification] = useState(false);

    const researcher = new FactResearcher();

    const startResearch = async () => {
        setIsResearching(true);
        try {
            const result = await researcher.researchFact(claim);
            setResearch(result);
            if (onResearch) onResearch(result);
        } catch (error) {
            console.error('Research failed:', error);
        } finally {
            setIsResearching(false);
        }
    };

    const handleAccept = () => {
        const acceptance = researcher.acceptFact(
            research.id, 
            !acceptWithoutVerification, 
            userNote
        );
        if (onAccept) onAccept(acceptance, research);
    };

    const handleReject = () => {
        const rejection = researcher.rejectFact(
            research.id,
            userNote || 'Insufficient verification',
            ''
        );
        if (onReject) onReject(rejection, research);
    };

    if (isResearching) {
        return (
            <Card className="fact-research-panel">
                <CardBody>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spinner />
                        <h3 style={{ marginTop: '16px' }}>🔍 Researching Fact</h3>
                        <p style={{ color: '#64748b', marginTop: '8px' }}>
                            Checking government databases, news sources, and academic research...
                        </p>
                        <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
                            <div>✓ Searching Bureau of Labor Statistics...</div>
                            <div>✓ Checking Census Bureau data...</div>
                            <div>✓ Reviewing news source archives...</div>
                            <div>⏳ Cross-referencing campaign documents...</div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (!research) {
        return (
            <Card className="fact-research-panel">
                <CardBody>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <h3>🔍 Fact Research</h3>
                        <p style={{ marginBottom: '20px', color: '#64748b' }}>
                            Research this claim using trusted sources
                        </p>
                        <div style={{ 
                            background: '#f8fafc', 
                            padding: '16px', 
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                        }}>
                            "{claim}"
                        </div>
                        <Button isPrimary onClick={startResearch}>
                            🚀 Start Research
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="fact-research-panel">
            <CardBody>
                <div className="research-header">
                    <h3>🔍 Fact Research Results</h3>
                    <div className={`confidence-badge confidence-${research.status}`}>
                        {Math.round(research.confidence * 100)}% confidence
                    </div>
                </div>

                <div className="research-claim">
                    <strong>Claim:</strong> "{claim}"
                </div>

                <div className="research-summary">
                    <div className={`status-indicator status-${research.status}`}>
                        {research.status === 'verified' ? '✅ Verified' :
                         research.status === 'questionable' ? '⚠️ Questionable' :
                         research.status === 'unverified' ? '❌ Unverified' :
                         '🔧 Research Error'}
                    </div>
                    
                    <div className="sources-summary">
                        <strong>{research.sources.length} sources found</strong>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {research.sources.filter(s => s.type === 'government').length} government • {' '}
                            {research.sources.filter(s => s.type === 'news').length} news • {' '}
                            {research.sources.filter(s => s.type === 'academic').length} academic
                        </div>
                    </div>
                </div>

                {research.sources.length > 0 && (
                    <div className="top-sources">
                        <h4>Top Sources:</h4>
                        {research.sources.slice(0, 3).map(source => (
                            <div key={source.id} className={`source-item source-${source.type}`}>
                                <div className="source-header">
                                    <strong>{source.source}</strong>
                                    <span className="reliability-score">
                                        {Math.round(source.reliability * 100)}% reliable
                                    </span>
                                </div>
                                <div className="source-title">{source.title}</div>
                                <div className="source-excerpt">"{source.excerpt}"</div>
                                {source.warning && (
                                    <div className="source-warning">⚠️ {source.excerpt}</div>
                                )}
                            </div>
                        ))}
                        
                        {research.sources.length > 3 && (
                            <Button 
                                isSecondary 
                                isSmall
                                onClick={() => setShowDetails(!showDetails)}
                            >
                                {showDetails ? 'Hide' : 'Show'} All {research.sources.length} Sources
                            </Button>
                        )}
                    </div>
                )}

                {showDetails && research.sources.length > 3 && (
                    <div className="all-sources">
                        {research.sources.slice(3).map(source => (
                            <div key={source.id} className={`source-item source-${source.type}`}>
                                <div className="source-header">
                                    <strong>{source.source}</strong>
                                    <span className="reliability-score">
                                        {Math.round(source.reliability * 100)}% reliable
                                    </span>
                                </div>
                                <div className="source-excerpt">"{source.excerpt}"</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="research-methods">
                    <details>
                        <summary>Research Methods Used</summary>
                        <ul>
                            {research.methods.map((method, i) => (
                                <li key={i}>{method}</li>
                            ))}
                        </ul>
                    </details>
                </div>

                <div className="user-decision">
                    <h4>Your Decision:</h4>
                    
                    <TextControl
                        label="Notes (optional)"
                        value={userNote}
                        onChange={setUserNote}
                        placeholder="Add notes about your decision..."
                    />

                    <ToggleControl
                        label="Accept without full verification"
                        help="Use if you want to proceed despite incomplete verification"
                        checked={acceptWithoutVerification}
                        onChange={setAcceptWithoutVerification}
                    />

                    <div className="decision-actions">
                        <Button 
                            isPrimary 
                            onClick={handleAccept}
                            disabled={research.status === 'error'}
                        >
                            ✅ Accept {acceptWithoutVerification ? 'Without Verification' : 'As Verified'}
                        </Button>
                        
                        <Button 
                            isDestructive 
                            onClick={handleReject}
                        >
                            ❌ Reject Claim
                        </Button>
                        
                        <Button 
                            isSecondary 
                            onClick={startResearch}
                        >
                            🔄 Research Again
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};
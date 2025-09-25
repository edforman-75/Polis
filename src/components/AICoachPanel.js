import { Panel, PanelBody, Button, Card, CardBody, Spinner, Notice } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

export const AICoachPanel = ({ blockContent, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Get current editor content
    const content = useSelect((select) => {
        const blocks = select('core/block-editor').getBlocks();
        return blocks.map(block => block.attributes).filter(Boolean);
    }, []);

    useEffect(() => {
        analyzeContent();
    }, [blockContent]);

    const analyzeContent = async () => {
        setLoading(true);
        
        // Simulate AI analysis (would be API call in production)
        setTimeout(() => {
            setAnalysis({
                overview: {
                    score: 78,
                    status: 'good',
                    summary: 'Content is well-structured but needs optimization for AI discovery'
                },
                aiPlatforms: {
                    google: {
                        score: 85,
                        tips: [
                            'Add FAQ schema for featured snippets',
                            'Include definition-style answers for "what is" queries',
                            'Use bullet points for list-based featured snippets'
                        ]
                    },
                    perplexity: {
                        score: 72,
                        tips: [
                            'Add more authoritative citations and sources',
                            'Include specific data points and statistics',
                            'Structure arguments with clear claim-evidence format'
                        ]
                    },
                    chatgpt: {
                        score: 80,
                        tips: [
                            'Use conversational Q&A format',
                            'Include contextual information for complex topics',
                            'Add examples and analogies for better understanding'
                        ]
                    },
                    claude: {
                        score: 76,
                        tips: [
                            'Provide balanced perspectives on issues',
                            'Include ethical considerations',
                            'Add nuanced analysis with multiple viewpoints'
                        ]
                    },
                    voice: {
                        score: 68,
                        tips: [
                            'Start paragraphs with direct answers',
                            'Use natural language patterns',
                            'Include phonetic spellings for complex names',
                            'Add speakable schema markup'
                        ]
                    }
                },
                keywords: {
                    missing: ['healthcare reform', 'economic growth', 'community safety'],
                    density: {
                        current: 1.2,
                        optimal: 2.0
                    }
                },
                structure: {
                    issues: [
                        'Missing H2 headers for better content hierarchy',
                        'Paragraphs too long for AI extraction (aim for 3-4 sentences)',
                        'No numbered lists for policy points'
                    ]
                },
                schema: {
                    present: ['NewsArticle', 'Person'],
                    missing: ['FAQPage', 'PolicyPosition', 'ElectionPromise'],
                    completeness: 65
                },
                voice: {
                    consistency: 82,
                    issues: [
                        'Passive voice in paragraph 3',
                        'Technical jargon needs simplification',
                        'Missing personal pronouns for connection'
                    ]
                },
                suggestions: [
                    {
                        priority: 'high',
                        action: 'Add FAQ section',
                        reason: 'Captures 43% more voice search queries',
                        example: 'Q: What is [Candidate]\'s position on healthcare?\nA: [Candidate] believes that every American deserves affordable healthcare. The plan includes...'
                    },
                    {
                        priority: 'high',
                        action: 'Include location-specific content',
                        reason: 'Improves local AI discovery by 60%',
                        example: 'In [City/State], this policy will create 5,000 new jobs...'
                    },
                    {
                        priority: 'medium',
                        action: 'Add numbered policy points',
                        reason: 'AI systems prefer structured lists',
                        example: '1. Reduce prescription costs by 50%\n2. Expand Medicare coverage\n3. Protect pre-existing conditions'
                    }
                ]
            });
            setLoading(false);
        }, 1500);
    };

    const applyFix = (suggestion) => {
        // In production, this would modify the block content
        console.log('Applying fix:', suggestion);
    };

    if (loading) {
        return (
            <Card className="ai-coach-panel">
                <CardBody>
                    <Spinner /> Analyzing content for AI optimization...
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="ai-coach-panel">
            <Card>
                <CardBody>
                    <div className="ai-coach-header">
                        <h3>AI Optimization Coach</h3>
                        <Button isSmall onClick={onClose}>×</Button>
                    </div>

                    <div className="ai-coach-tabs">
                        <Button 
                            isPressed={activeTab === 'overview'}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </Button>
                        <Button 
                            isPressed={activeTab === 'platforms'}
                            onClick={() => setActiveTab('platforms')}
                        >
                            AI Platforms
                        </Button>
                        <Button 
                            isPressed={activeTab === 'schema'}
                            onClick={() => setActiveTab('schema')}
                        >
                            Schema
                        </Button>
                        <Button 
                            isPressed={activeTab === 'voice'}
                            onClick={() => setActiveTab('voice')}
                        >
                            Voice & Style
                        </Button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="ai-coach-content">
                            <div className="overall-score">
                                <div className="score-circle" data-score={analysis.overview.score}>
                                    <span className="score-number">{analysis.overview.score}</span>
                                    <span className="score-label">AI Score</span>
                                </div>
                                <p>{analysis.overview.summary}</p>
                            </div>

                            <h4>Top Recommendations</h4>
                            {analysis.suggestions.map((suggestion, index) => (
                                <Notice
                                    key={index}
                                    status={suggestion.priority === 'high' ? 'warning' : 'info'}
                                    isDismissible={false}
                                >
                                    <div className="suggestion-item">
                                        <strong>{suggestion.action}</strong>
                                        <p>{suggestion.reason}</p>
                                        <details>
                                            <summary>See example</summary>
                                            <code>{suggestion.example}</code>
                                        </details>
                                        <Button 
                                            isSmall 
                                            isPrimary
                                            onClick={() => applyFix(suggestion)}
                                        >
                                            Apply Fix
                                        </Button>
                                    </div>
                                </Notice>
                            ))}
                        </div>
                    )}

                    {activeTab === 'platforms' && (
                        <div className="ai-coach-content">
                            <h4>Platform-Specific Optimization</h4>
                            {Object.entries(analysis.aiPlatforms).map(([platform, data]) => (
                                <Card key={platform} size="small" className="platform-card">
                                    <CardBody>
                                        <div className="platform-header">
                                            <h5>{platform.charAt(0).toUpperCase() + platform.slice(1)}</h5>
                                            <span className={`score ${data.score > 80 ? 'good' : data.score > 60 ? 'okay' : 'poor'}`}>
                                                {data.score}%
                                            </span>
                                        </div>
                                        <ul className="platform-tips">
                                            {data.tips.map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'schema' && (
                        <div className="ai-coach-content">
                            <h4>Schema Markup Analysis</h4>
                            <div className="schema-status">
                                <div className="schema-score">
                                    <strong>Completeness:</strong> {analysis.schema.completeness}%
                                </div>
                                <div className="schema-present">
                                    <strong>✓ Present:</strong> {analysis.schema.present.join(', ')}
                                </div>
                                <div className="schema-missing">
                                    <strong>⚠ Missing:</strong> {analysis.schema.missing.join(', ')}
                                </div>
                            </div>
                            <Button isPrimary onClick={() => console.log('Add missing schemas')}>
                                Add Missing Schemas
                            </Button>
                        </div>
                    )}

                    {activeTab === 'voice' && (
                        <div className="ai-coach-content">
                            <h4>Voice Consistency Analysis</h4>
                            <div className="voice-score">
                                <strong>Consistency Score:</strong> {analysis.voice.consistency}%
                            </div>
                            <h5>Issues to Address:</h5>
                            <ul>
                                {analysis.voice.issues.map((issue, i) => (
                                    <li key={i}>{issue}</li>
                                ))}
                            </ul>
                            <Button onClick={() => console.log('Check voice guide')}>
                                View Campaign Voice Guide
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};
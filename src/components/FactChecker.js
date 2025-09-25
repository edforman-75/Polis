import { useState, useEffect } from '@wordpress/element';
import { Card, CardBody, Spinner, Notice, Button, Modal, TextControl } from '@wordpress/components';

export const FactChecker = ({ content, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [factChecks, setFactChecks] = useState([]);
    const [contradictions, setContradictions] = useState([]);
    const [sources, setSources] = useState([]);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [newSource, setNewSource] = useState({ title: '', url: '', description: '' });

    useEffect(() => {
        if (content) {
            performFactCheck();
            checkContradictions();
        }
    }, [content]);

    const performFactCheck = async () => {
        setLoading(true);
        
        // Simulate fact-checking API call
        // In production, this would integrate with fact-checking services like:
        // - Google Fact Check Tools API
        // - FactCheck.org API
        // - PolitiFact API
        // - Custom campaign fact database
        
        setTimeout(() => {
            const simulatedChecks = [
                {
                    id: 1,
                    claim: "50,000 new jobs will be created",
                    status: "needs_verification",
                    confidence: 0.7,
                    sources: [
                        {
                            title: "Bureau of Labor Statistics Infrastructure Job Projections",
                            url: "https://bls.gov/...",
                            excerpt: "Infrastructure spending typically creates 25-30 jobs per $1M invested"
                        }
                    ],
                    suggestion: "Provide specific methodology for job calculation and cite economic analysis",
                    category: "economic_impact"
                },
                {
                    id: 2,
                    claim: "$2 billion infrastructure investment",
                    status: "verified",
                    confidence: 0.95,
                    sources: [
                        {
                            title: "Campaign Policy Document: Infrastructure Plan",
                            url: "/policy/infrastructure",
                            excerpt: "Detailed budget allocation for transportation infrastructure"
                        }
                    ],
                    category: "budget"
                },
                {
                    id: 3,
                    claim: "Healthcare costs will be reduced by 30%",
                    status: "questionable",
                    confidence: 0.3,
                    sources: [],
                    suggestion: "This claim lacks specific supporting evidence. Consider providing studies or comparable policy outcomes.",
                    category: "healthcare"
                }
            ];
            
            setFactChecks(simulatedChecks);
            setLoading(false);
        }, 1500);
    };

    const checkContradictions = async () => {
        // Check against existing campaign documents for contradictions
        const existingDocuments = await getCampaignDocuments();
        
        const contradictionChecks = [
            {
                id: 1,
                type: "policy_inconsistency",
                claim: "50,000 new jobs from infrastructure",
                contradictsWith: "Previous press release cited 45,000 jobs",
                severity: "medium",
                document: "Press Release - March 2024",
                suggestion: "Reconcile job creation numbers or explain the difference"
            },
            {
                id: 2,
                type: "timeline_conflict",
                claim: "5-year implementation timeline",
                contradictsWith: "Policy paper mentions 4-year timeline",
                severity: "low",
                document: "Infrastructure Policy Paper",
                suggestion: "Clarify implementation timeline across all documents"
            }
        ];
        
        setContradictions(contradictionChecks);
    };

    const getCampaignDocuments = async () => {
        // In production, this would fetch from campaign document database
        return [
            { id: 1, title: "Healthcare Policy", type: "policy", date: "2024-02-15" },
            { id: 2, title: "Infrastructure Announcement", type: "press_release", date: "2024-03-01" },
            { id: 3, title: "Education Reform Plan", type: "policy", date: "2024-03-10" }
        ];
    };

    const addVerificationSource = () => {
        if (newSource.title && newSource.url) {
            setSources([...sources, { ...newSource, id: Date.now() }]);
            setNewSource({ title: '', url: '', description: '' });
            setShowSourceModal(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return '#10b981';
            case 'needs_verification': return '#f59e0b';
            case 'questionable': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    if (loading) {
        return (
            <Card className="fact-checker-panel">
                <CardBody>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spinner />
                        <p>Fact-checking content and checking for contradictions...</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="fact-checker-panel">
            <Card>
                <CardBody>
                    <div className="fact-checker-header">
                        <h3>🔍 Fact Checker & Contradiction Detection</h3>
                        <Button isSmall onClick={onClose}>×</Button>
                    </div>

                    <div className="fact-check-tabs">
                        <div className="tab-content">
                            {/* Fact Check Results */}
                            <div className="fact-checks-section">
                                <h4>Fact Check Results</h4>
                                {factChecks.map(check => (
                                    <div key={check.id} className="fact-check-item">
                                        <div className="fact-check-header">
                                            <div 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(check.status) }}
                                            >
                                                {check.status.replace('_', ' ').toUpperCase()}
                                            </div>
                                            <span className="confidence">
                                                {Math.round(check.confidence * 100)}% confidence
                                            </span>
                                        </div>
                                        
                                        <div className="claim-text">
                                            <strong>Claim:</strong> "{check.claim}"
                                        </div>
                                        
                                        {check.suggestion && (
                                            <div className="suggestion">
                                                <strong>Suggestion:</strong> {check.suggestion}
                                            </div>
                                        )}
                                        
                                        {check.sources.length > 0 && (
                                            <div className="sources">
                                                <strong>Sources:</strong>
                                                <ul>
                                                    {check.sources.map((source, i) => (
                                                        <li key={i}>
                                                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                                                                {source.title}
                                                            </a>
                                                            {source.excerpt && (
                                                                <p className="source-excerpt">"{source.excerpt}"</p>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        <div className="fact-check-actions">
                                            <Button isSmall isPrimary>
                                                Mark as Verified
                                            </Button>
                                            <Button isSmall isSecondary>
                                                Request Additional Sources
                                            </Button>
                                            <Button isSmall isDestructive>
                                                Flag for Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Contradiction Detection */}
                            {contradictions.length > 0 && (
                                <div className="contradictions-section">
                                    <h4>⚠️ Potential Contradictions</h4>
                                    {contradictions.map(contradiction => (
                                        <div key={contradiction.id} className="contradiction-item">
                                            <div className="contradiction-header">
                                                <div 
                                                    className="severity-badge"
                                                    style={{ backgroundColor: getSeverityColor(contradiction.severity) }}
                                                >
                                                    {contradiction.severity.toUpperCase()}
                                                </div>
                                                <span className="contradiction-type">
                                                    {contradiction.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            
                                            <div className="contradiction-details">
                                                <div className="current-claim">
                                                    <strong>Current:</strong> {contradiction.claim}
                                                </div>
                                                <div className="conflicts-with">
                                                    <strong>Conflicts with:</strong> {contradiction.contradictsWith}
                                                </div>
                                                <div className="source-document">
                                                    <strong>Source:</strong> {contradiction.document}
                                                </div>
                                                <div className="resolution-suggestion">
                                                    <strong>Suggestion:</strong> {contradiction.suggestion}
                                                </div>
                                            </div>
                                            
                                            <div className="contradiction-actions">
                                                <Button isSmall isPrimary>
                                                    Resolve Contradiction
                                                </Button>
                                                <Button isSmall isSecondary>
                                                    View Source Document
                                                </Button>
                                                <Button isSmall>
                                                    Add Explanation
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Manual Source Addition */}
                            <div className="sources-management">
                                <h4>Sources & Verification</h4>
                                <Button 
                                    isPrimary 
                                    onClick={() => setShowSourceModal(true)}
                                >
                                    Add Verification Source
                                </Button>
                                
                                {sources.length > 0 && (
                                    <div className="added-sources">
                                        <h5>Added Sources:</h5>
                                        <ul>
                                            {sources.map(source => (
                                                <li key={source.id}>
                                                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                                                        {source.title}
                                                    </a>
                                                    {source.description && (
                                                        <p>{source.description}</p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* AI-Powered Suggestions */}
                            <div className="ai-fact-suggestions">
                                <h4>🤖 AI Fact-Checking Suggestions</h4>
                                <div className="suggestion-list">
                                    <div className="ai-suggestion">
                                        <strong>Strengthen Claims:</strong> Add specific citations for all numerical claims (job numbers, budget figures, timelines)
                                    </div>
                                    <div className="ai-suggestion">
                                        <strong>Comparative Context:</strong> Include how your proposals compare to similar policies in other states
                                    </div>
                                    <div className="ai-suggestion">
                                        <strong>Third-party Validation:</strong> Reference independent studies or expert endorsements where available
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Source Addition Modal */}
            {showSourceModal && (
                <Modal
                    title="Add Verification Source"
                    onRequestClose={() => setShowSourceModal(false)}
                >
                    <div className="source-form">
                        <TextControl
                            label="Source Title"
                            value={newSource.title}
                            onChange={(title) => setNewSource({ ...newSource, title })}
                            placeholder="e.g., Congressional Budget Office Report"
                        />
                        <TextControl
                            label="URL"
                            value={newSource.url}
                            onChange={(url) => setNewSource({ ...newSource, url })}
                            placeholder="https://..."
                            type="url"
                        />
                        <TextControl
                            label="Description (Optional)"
                            value={newSource.description}
                            onChange={(description) => setNewSource({ ...newSource, description })}
                            placeholder="Brief description of what this source validates"
                        />
                        <div className="modal-actions">
                            <Button isPrimary onClick={addVerificationSource}>
                                Add Source
                            </Button>
                            <Button isSecondary onClick={() => setShowSourceModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
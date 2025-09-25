import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl, DatePicker, Button, ToggleControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

registerBlockType('campaign/legislative-record', {
    title: 'Legislative Record (AI-Enhanced)',
    icon: 'portfolio',
    category: 'campaign-schema',
    attributes: {
        candidateName: { type: 'string', default: '' },
        officialTitle: { type: 'string', default: '' },
        termDates: { type: 'string', default: '' },
        votingRecord: { type: 'array', default: [] },
        sponsoredBills: { type: 'array', default: [] },
        accomplishments: { type: 'array', default: [] },
        committees: { type: 'array', default: [] },
        attendanceRate: { type: 'number', default: 0 },
        effectiveness: { type: 'object', default: {} },
        displayOptions: {
            type: 'object',
            default: {
                showVotingRecord: true,
                showBills: true,
                showAccomplishments: true,
                showCommittees: true,
                showStats: true
            }
        },
        schemaMarkup: { type: 'object', default: {} }
    },

    edit: ({ attributes, setAttributes }) => {
        const [govTrackData, setGovTrackData] = useState(null);
        const [loading, setLoading] = useState(false);

        // Auto-generate comprehensive schema markup
        useEffect(() => {
            const schema = {
                '@context': 'https://schema.org',
                '@type': 'Person',
                '@id': `#person-${attributes.candidateName.replace(/\s+/g, '-').toLowerCase()}`,
                'name': attributes.candidateName,
                'jobTitle': attributes.officialTitle,
                'hasOccupation': {
                    '@type': 'Occupation',
                    'name': 'Elected Official',
                    'occupationLocation': {
                        '@type': 'Place',
                        'name': 'United States Congress'
                    }
                },
                'memberOf': attributes.committees.map(committee => ({
                    '@type': 'Organization',
                    'name': committee.name,
                    'description': `Congressional Committee: ${committee.name}`
                })),
                'award': attributes.accomplishments.map(accomplishment => ({
                    '@type': 'Thing',
                    'name': accomplishment.title,
                    'description': accomplishment.description,
                    'dateCreated': accomplishment.date
                })),
                'worksFor': {
                    '@type': 'Organization',
                    'name': 'United States Congress',
                    'description': 'Legislative branch of the United States government'
                },
                // Voting record as actions
                'potentialAction': attributes.votingRecord.map(vote => ({
                    '@type': 'VoteAction',
                    'option': vote.position,
                    'object': {
                        '@type': 'Legislation',
                        'name': vote.bill,
                        'description': vote.description,
                        'identifier': vote.billNumber
                    },
                    'startTime': vote.date
                })),
                // Bills sponsored as creative works
                'creator': attributes.sponsoredBills.map(bill => ({
                    '@type': 'Legislation',
                    'name': bill.title,
                    'description': bill.summary,
                    'identifier': bill.number,
                    'datePublished': bill.introducedDate,
                    'legislationStatus': bill.status,
                    'about': bill.issueArea
                })),
                // Performance metrics
                'knowsAbout': attributes.effectiveness.topIssues || [],
                'performanceRating': {
                    '@type': 'Rating',
                    'ratingValue': attributes.attendanceRate,
                    'bestRating': 100,
                    'ratingExplanation': 'Congressional attendance rate'
                },
                // AI-optimized speakable content
                'speakable': {
                    '@type': 'SpeakableSpecification',
                    'cssSelector': ['.legislative-stats', '.top-accomplishments', '.voting-highlights']
                }
            };

            setAttributes({ schemaMarkup: schema });
        }, [
            attributes.candidateName,
            attributes.votingRecord,
            attributes.sponsoredBills,
            attributes.accomplishments,
            attributes.committees
        ]);

        // Simulate fetching data from GovTrack or similar API
        const fetchLegislativeData = async () => {
            setLoading(true);
            
            // In production, this would call:
            // - GovTrack.us API
            // - Congress.gov API
            // - ProPublica Congress API
            // - Custom campaign database
            
            setTimeout(() => {
                const mockData = {
                    votingRecord: [
                        {
                            id: 1,
                            bill: 'Infrastructure Investment and Jobs Act',
                            billNumber: 'H.R.3684',
                            position: 'Yes',
                            date: '2021-11-05',
                            description: 'Bipartisan infrastructure legislation',
                            category: 'Infrastructure',
                            significance: 'Major'
                        },
                        {
                            id: 2,
                            bill: 'CHIPS and Science Act',
                            billNumber: 'H.R.4346',
                            position: 'Yes',
                            date: '2022-07-28',
                            description: 'Semiconductor manufacturing and research',
                            category: 'Technology',
                            significance: 'Major'
                        },
                        {
                            id: 3,
                            bill: 'American Rescue Plan Act',
                            billNumber: 'H.R.1319',
                            position: 'Yes',
                            date: '2021-03-10',
                            description: 'COVID-19 economic relief package',
                            category: 'Healthcare',
                            significance: 'Major'
                        }
                    ],
                    sponsoredBills: [
                        {
                            id: 1,
                            title: 'Secure 5G and Beyond Act',
                            number: 'H.R.4500',
                            status: 'Enacted',
                            introducedDate: '2020-02-15',
                            summary: 'Develops a national strategy to protect 5G telecommunications',
                            issueArea: 'Technology & Communications',
                            bipartisan: true,
                            cosponsors: 45
                        },
                        {
                            id: 2,
                            title: 'End Drug Shortages Act',
                            number: 'H.R.10239',
                            status: 'Introduced',
                            introducedDate: '2024-01-20',
                            summary: 'Addresses prescription drug shortages',
                            issueArea: 'Healthcare',
                            bipartisan: true,
                            cosponsors: 23
                        }
                    ],
                    accomplishments: [
                        {
                            id: 1,
                            title: 'Bipartisan Secure 5G Act Signed into Law',
                            description: 'Successfully led bipartisan effort to protect US telecommunications',
                            date: '2020-12-20',
                            category: 'National Security',
                            impact: 'Protected critical infrastructure from foreign threats'
                        },
                        {
                            id: 2,
                            title: 'VA Healthcare Accessibility Improvement',
                            description: 'Secured $50M funding for rural VA healthcare facilities',
                            date: '2022-06-15',
                            category: 'Veterans Affairs',
                            impact: 'Improved healthcare access for 15,000 rural veterans'
                        }
                    ],
                    committees: [
                        {
                            name: 'House Committee on Agriculture',
                            role: 'Member',
                            startDate: '2019-01-03'
                        },
                        {
                            name: 'House Committee on Foreign Affairs',
                            role: 'Member',
                            startDate: '2019-01-03'
                        }
                    ],
                    stats: {
                        attendanceRate: 97.3,
                        billsSponsored: 47,
                        billsEnacted: 8,
                        bipartisanScore: 85,
                        effectivenessRank: 12
                    }
                };

                setGovTrackData(mockData);
                setAttributes({
                    votingRecord: mockData.votingRecord,
                    sponsoredBills: mockData.sponsoredBills,
                    accomplishments: mockData.accomplishments,
                    committees: mockData.committees,
                    attendanceRate: mockData.stats.attendanceRate,
                    effectiveness: mockData.stats
                });
                setLoading(false);
            }, 2000);
        };

        const addCustomVote = () => {
            const newVote = {
                id: Date.now(),
                bill: '',
                billNumber: '',
                position: 'Yes',
                date: new Date().toISOString().split('T')[0],
                description: '',
                category: 'Other',
                significance: 'Regular'
            };
            setAttributes({
                votingRecord: [...attributes.votingRecord, newVote]
            });
        };

        const addCustomBill = () => {
            const newBill = {
                id: Date.now(),
                title: '',
                number: '',
                status: 'Introduced',
                introducedDate: new Date().toISOString().split('T')[0],
                summary: '',
                issueArea: '',
                bipartisan: false,
                cosponsors: 0
            };
            setAttributes({
                sponsoredBills: [...attributes.sponsoredBills, newBill]
            });
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title="Candidate Information">
                        <TextControl
                            label="Candidate Name"
                            value={attributes.candidateName}
                            onChange={(candidateName) => setAttributes({ candidateName })}
                        />
                        <TextControl
                            label="Official Title"
                            value={attributes.officialTitle}
                            onChange={(officialTitle) => setAttributes({ officialTitle })}
                            help="e.g., Representative, Senator"
                        />
                        <TextControl
                            label="Term Dates"
                            value={attributes.termDates}
                            onChange={(termDates) => setAttributes({ termDates })}
                            help="e.g., 2019-2024"
                        />
                    </PanelBody>

                    <PanelBody title="Display Options">
                        <ToggleControl
                            label="Show Voting Record"
                            checked={attributes.displayOptions.showVotingRecord}
                            onChange={(showVotingRecord) => setAttributes({
                                displayOptions: { ...attributes.displayOptions, showVotingRecord }
                            })}
                        />
                        <ToggleControl
                            label="Show Sponsored Bills"
                            checked={attributes.displayOptions.showBills}
                            onChange={(showBills) => setAttributes({
                                displayOptions: { ...attributes.displayOptions, showBills }
                            })}
                        />
                        <ToggleControl
                            label="Show Accomplishments"
                            checked={attributes.displayOptions.showAccomplishments}
                            onChange={(showAccomplishments) => setAttributes({
                                displayOptions: { ...attributes.displayOptions, showAccomplishments }
                            })}
                        />
                        <ToggleControl
                            label="Show Committee Assignments"
                            checked={attributes.displayOptions.showCommittees}
                            onChange={(showCommittees) => setAttributes({
                                displayOptions: { ...attributes.displayOptions, showCommittees }
                            })}
                        />
                        <ToggleControl
                            label="Show Statistics"
                            checked={attributes.displayOptions.showStats}
                            onChange={(showStats) => setAttributes({
                                displayOptions: { ...attributes.displayOptions, showStats }
                            })}
                        />
                    </PanelBody>

                    <PanelBody title="Data Import">
                        <Button 
                            isPrimary 
                            onClick={fetchLegislativeData}
                            disabled={loading}
                        >
                            {loading ? 'Fetching...' : 'Import from GovTrack/Congress.gov'}
                        </Button>
                        <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                            Automatically imports voting record, sponsored bills, and committee assignments
                        </p>
                    </PanelBody>
                </InspectorControls>

                <div className="legislative-record-block">
                    <div className="record-header">
                        <RichText
                            tagName="h2"
                            placeholder="Legislative Record"
                            value={`Legislative Record: ${attributes.candidateName || 'Candidate Name'}`}
                            onChange={() => {}} // Header is auto-generated
                            readOnly
                        />
                        
                        {attributes.termDates && (
                            <div className="term-info">
                                <span className="term-dates">{attributes.termDates}</span>
                                <span className="official-title">{attributes.officialTitle}</span>
                            </div>
                        )}
                    </div>

                    {loading && (
                        <div className="loading-state">
                            <p>📊 Importing legislative data...</p>
                        </div>
                    )}

                    {/* Statistics Overview */}
                    {attributes.displayOptions.showStats && attributes.effectiveness && (
                        <div className="legislative-stats">
                            <h3>Key Statistics</h3>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-value">{attributes.attendanceRate}%</div>
                                    <div className="stat-label">Attendance Rate</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value">{attributes.effectiveness.billsSponsored || 0}</div>
                                    <div className="stat-label">Bills Sponsored</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value">{attributes.effectiveness.billsEnacted || 0}</div>
                                    <div className="stat-label">Bills Enacted</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value">{attributes.effectiveness.bipartisanScore || 0}%</div>
                                    <div className="stat-label">Bipartisan Score</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Major Accomplishments */}
                    {attributes.displayOptions.showAccomplishments && (
                        <div className="accomplishments-section">
                            <h3>Top Accomplishments</h3>
                            {attributes.accomplishments.map(accomplishment => (
                                <div key={accomplishment.id} className="accomplishment-item">
                                    <div className="accomplishment-header">
                                        <strong>{accomplishment.title}</strong>
                                        <span className="accomplishment-date">{accomplishment.date}</span>
                                    </div>
                                    <div className="accomplishment-description">
                                        {accomplishment.description}
                                    </div>
                                    {accomplishment.impact && (
                                        <div className="accomplishment-impact">
                                            <strong>Impact:</strong> {accomplishment.impact}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Voting Highlights */}
                    {attributes.displayOptions.showVotingRecord && (
                        <div className="voting-highlights">
                            <h3>Key Votes</h3>
                            <div className="voting-actions">
                                <Button isSmall onClick={addCustomVote}>Add Vote</Button>
                            </div>
                            {attributes.votingRecord.map(vote => (
                                <div key={vote.id} className="vote-item">
                                    <div className="vote-header">
                                        <div className="bill-info">
                                            <strong>{vote.bill}</strong>
                                            <span className="bill-number">({vote.billNumber})</span>
                                        </div>
                                        <div className={`vote-position ${vote.position.toLowerCase()}`}>
                                            {vote.position}
                                        </div>
                                    </div>
                                    <div className="vote-description">{vote.description}</div>
                                    <div className="vote-meta">
                                        <span className="vote-date">{vote.date}</span>
                                        <span className="vote-category">{vote.category}</span>
                                        {vote.significance === 'Major' && (
                                            <span className="significance-badge">Major Vote</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sponsored Legislation */}
                    {attributes.displayOptions.showBills && (
                        <div className="sponsored-bills">
                            <h3>Sponsored Legislation</h3>
                            <div className="bills-actions">
                                <Button isSmall onClick={addCustomBill}>Add Bill</Button>
                            </div>
                            {attributes.sponsoredBills.map(bill => (
                                <div key={bill.id} className="bill-item">
                                    <div className="bill-header">
                                        <div className="bill-title">
                                            <strong>{bill.title}</strong>
                                            <span className="bill-number">({bill.number})</span>
                                        </div>
                                        <div className={`bill-status ${bill.status.toLowerCase().replace(' ', '-')}`}>
                                            {bill.status}
                                        </div>
                                    </div>
                                    <div className="bill-summary">{bill.summary}</div>
                                    <div className="bill-meta">
                                        <span className="introduced-date">Introduced: {bill.introducedDate}</span>
                                        <span className="issue-area">{bill.issueArea}</span>
                                        {bill.bipartisan && <span className="bipartisan-badge">Bipartisan</span>}
                                        <span className="cosponsors">{bill.cosponsors} cosponsors</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Committee Assignments */}
                    {attributes.displayOptions.showCommittees && (
                        <div className="committees-section">
                            <h3>Committee Assignments</h3>
                            {attributes.committees.map((committee, index) => (
                                <div key={index} className="committee-item">
                                    <strong>{committee.name}</strong>
                                    <span className="committee-role">({committee.role})</span>
                                    {committee.startDate && (
                                        <span className="committee-date">Since {committee.startDate}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AI Optimization Tips */}
                    <div className="ai-optimization-tips">
                        <h4>🤖 AI Optimization Status</h4>
                        <ul>
                            <li>✓ Comprehensive schema markup for search engines</li>
                            <li>✓ Structured data for voice assistant queries</li>
                            <li>✓ Performance metrics for fact-checking</li>
                            <li>{attributes.votingRecord.length > 0 ? '✓' : '⚠'} Voting record {attributes.votingRecord.length > 0 ? 'included' : 'needs data'}</li>
                            <li>{attributes.accomplishments.length > 0 ? '✓' : '⚠'} Accomplishments {attributes.accomplishments.length > 0 ? 'documented' : 'need details'}</li>
                        </ul>
                    </div>
                </div>

                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify(attributes.schemaMarkup, null, 2)
                }} />
            </>
        );
    },

    save: ({ attributes }) => {
        return (
            <div className="legislative-record-block">
                <div className="record-header">
                    <h2>Legislative Record: {attributes.candidateName}</h2>
                    {attributes.termDates && (
                        <div className="term-info">
                            <span className="term-dates">{attributes.termDates}</span>
                            <span className="official-title">{attributes.officialTitle}</span>
                        </div>
                    )}
                </div>

                {/* Statistics */}
                {attributes.displayOptions.showStats && (
                    <div className="legislative-stats">
                        <h3>Key Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-value">{attributes.attendanceRate}%</div>
                                <div className="stat-label">Attendance Rate</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{attributes.effectiveness.billsSponsored || 0}</div>
                                <div className="stat-label">Bills Sponsored</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{attributes.effectiveness.billsEnacted || 0}</div>
                                <div className="stat-label">Bills Enacted</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{attributes.effectiveness.bipartisanScore || 0}%</div>
                                <div className="stat-label">Bipartisan Score</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Accomplishments */}
                {attributes.displayOptions.showAccomplishments && (
                    <div className="top-accomplishments">
                        <h3>Top Accomplishments</h3>
                        {attributes.accomplishments.map(accomplishment => (
                            <div key={accomplishment.id} className="accomplishment-item">
                                <div className="accomplishment-header">
                                    <strong>{accomplishment.title}</strong>
                                    <span className="accomplishment-date">{accomplishment.date}</span>
                                </div>
                                <div className="accomplishment-description">
                                    {accomplishment.description}
                                </div>
                                {accomplishment.impact && (
                                    <div className="accomplishment-impact">
                                        <strong>Impact:</strong> {accomplishment.impact}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Voting Record */}
                {attributes.displayOptions.showVotingRecord && (
                    <div className="voting-highlights">
                        <h3>Key Votes</h3>
                        {attributes.votingRecord.map(vote => (
                            <div key={vote.id} className="vote-item">
                                <div className="vote-header">
                                    <div className="bill-info">
                                        <strong>{vote.bill}</strong>
                                        <span className="bill-number">({vote.billNumber})</span>
                                    </div>
                                    <div className={`vote-position ${vote.position.toLowerCase()}`}>
                                        {vote.position}
                                    </div>
                                </div>
                                <div className="vote-description">{vote.description}</div>
                                <div className="vote-meta">
                                    <span className="vote-date">{vote.date}</span>
                                    <span className="vote-category">{vote.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify(attributes.schemaMarkup, null, 2)
                }} />
            </div>
        );
    }
});
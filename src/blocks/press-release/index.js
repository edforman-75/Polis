import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, RichText, BlockControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, DateTimePicker, Button, Notice, ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { AICoachPanel } from '../../components/AICoachPanel';
import { SchemaGenerator } from '../../components/SchemaGenerator';

registerBlockType('campaign/press-release-header', {
    title: 'Press Release Header',
    icon: 'megaphone',
    category: 'campaign-core',
    attributes: {
        headline: {
            type: 'string',
            default: ''
        },
        subheadline: {
            type: 'string',
            default: ''
        },
        dateline: {
            type: 'string',
            default: ''
        },
        embargo: {
            type: 'string',
            default: ''
        },
        contact: {
            type: 'object',
            default: {
                name: '',
                email: '',
                phone: ''
            }
        },
        schemaMarkup: {
            type: 'object',
            default: {}
        },
        aiScore: {
            type: 'object',
            default: {
                overall: 0,
                seo: 0,
                voice: 0,
                discoverability: 0
            }
        }
    },

    edit: ({ attributes, setAttributes }) => {
        const [showAICoach, setShowAICoach] = useState(false);
        const [aiSuggestions, setAiSuggestions] = useState([]);
        const [schemaValid, setSchemaValid] = useState(true);

        // Auto-generate schema when content changes
        useEffect(() => {
            const schema = {
                '@context': 'https://schema.org',
                '@type': 'NewsArticle',
                'headline': attributes.headline,
                'alternativeHeadline': attributes.subheadline,
                'datePublished': new Date().toISOString(),
                'dateline': attributes.dateline,
                'author': {
                    '@type': 'Organization',
                    'name': campaignAI.candidateProfile.campaignName || 'Campaign HQ'
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': campaignAI.candidateProfile.campaignName || 'Campaign HQ',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': campaignAI.candidateProfile.logoUrl || ''
                    }
                },
                'mainEntityOfPage': {
                    '@type': 'WebPage',
                    '@id': window.location.href
                },
                'speakable': {
                    '@type': 'SpeakableSpecification',
                    'cssSelector': ['.press-release-headline', '.press-release-lead']
                }
            };

            setAttributes({ schemaMarkup: schema });
            validateForAI();
        }, [attributes.headline, attributes.subheadline, attributes.dateline]);

        const validateForAI = async () => {
            // Check headline for AI optimization
            const suggestions = [];
            
            // Length check for AI snippets
            if (attributes.headline.length > 60) {
                suggestions.push({
                    type: 'warning',
                    message: 'Headline is too long for optimal AI extraction (60 chars max)',
                    fix: 'Shorten headline to key message'
                });
            }

            // Keyword presence
            const hasLocationKeyword = campaignAI.keywords.geo.some(keyword => 
                attributes.headline.toLowerCase().includes(keyword.toLowerCase())
            );
            if (!hasLocationKeyword) {
                suggestions.push({
                    type: 'improvement',
                    message: 'Add location keyword for better local AI discovery',
                    fix: `Include "${campaignAI.keywords.geo[0]}" in headline`
                });
            }

            // Action words for voice assistants
            const actionWords = ['announces', 'launches', 'introduces', 'reveals', 'proposes'];
            const hasActionWord = actionWords.some(word => 
                attributes.headline.toLowerCase().includes(word)
            );
            if (!hasActionWord) {
                suggestions.push({
                    type: 'improvement',
                    message: 'Start with action verb for better AI summarization',
                    fix: 'Try: "Announces", "Launches", or "Proposes"'
                });
            }

            setAiSuggestions(suggestions);

            // Calculate AI optimization score
            const scores = {
                overall: 75,
                seo: hasLocationKeyword ? 85 : 60,
                voice: hasActionWord ? 90 : 65,
                discoverability: attributes.headline.length <= 60 ? 80 : 55
            };
            setAttributes({ aiScore: scores });
        };

        return (
            <>
                <BlockControls>
                    <ToolbarGroup>
                        <ToolbarButton
                            icon="lightbulb"
                            label="AI Coach"
                            onClick={() => setShowAICoach(!showAICoach)}
                            isPressed={showAICoach}
                        />
                        <ToolbarButton
                            icon="code-standards"
                            label="View Schema"
                            onClick={() => console.log(attributes.schemaMarkup)}
                        />
                    </ToolbarGroup>
                </BlockControls>

                <InspectorControls>
                    <PanelBody title="Press Release Settings">
                        <TextControl
                            label="Dateline (City, State)"
                            value={attributes.dateline}
                            onChange={(dateline) => setAttributes({ dateline })}
                            help="e.g., AUSTIN, TX"
                        />
                        <DateTimePicker
                            label="Embargo Until"
                            currentDate={attributes.embargo}
                            onChange={(embargo) => setAttributes({ embargo })}
                        />
                    </PanelBody>

                    <PanelBody title="Contact Information">
                        <TextControl
                            label="Contact Name"
                            value={attributes.contact.name}
                            onChange={(name) => setAttributes({ 
                                contact: { ...attributes.contact, name }
                            })}
                        />
                        <TextControl
                            label="Email"
                            type="email"
                            value={attributes.contact.email}
                            onChange={(email) => setAttributes({ 
                                contact: { ...attributes.contact, email }
                            })}
                        />
                        <TextControl
                            label="Phone"
                            type="tel"
                            value={attributes.contact.phone}
                            onChange={(phone) => setAttributes({ 
                                contact: { ...attributes.contact, phone }
                            })}
                        />
                    </PanelBody>

                    <PanelBody title="AI Optimization Score">
                        <div className="ai-scores">
                            <div className="score-item">
                                <label>Overall</label>
                                <div className="score-bar">
                                    <div className="score-fill" style={{ width: `${attributes.aiScore.overall}%` }}>
                                        {attributes.aiScore.overall}%
                                    </div>
                                </div>
                            </div>
                            <div className="score-item">
                                <label>SEO</label>
                                <div className="score-bar">
                                    <div className="score-fill" style={{ width: `${attributes.aiScore.seo}%` }}>
                                        {attributes.aiScore.seo}%
                                    </div>
                                </div>
                            </div>
                            <div className="score-item">
                                <label>Voice Search</label>
                                <div className="score-bar">
                                    <div className="score-fill" style={{ width: `${attributes.aiScore.voice}%` }}>
                                        {attributes.aiScore.voice}%
                                    </div>
                                </div>
                            </div>
                            <div className="score-item">
                                <label>AI Discovery</label>
                                <div className="score-bar">
                                    <div className="score-fill" style={{ width: `${attributes.aiScore.discoverability}%` }}>
                                        {attributes.aiScore.discoverability}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PanelBody>
                </InspectorControls>

                <div className="press-release-header-block">
                    {attributes.embargo && (
                        <div className="embargo-notice">
                            EMBARGOED UNTIL: {new Date(attributes.embargo).toLocaleString()}
                        </div>
                    )}
                    
                    <div className="press-release-meta">
                        <span className="for-immediate-release">FOR IMMEDIATE RELEASE</span>
                        <span className="dateline">{attributes.dateline || 'CITY, STATE'}</span>
                        <span className="date">{new Date().toLocaleDateString()}</span>
                    </div>

                    <RichText
                        tagName="h1"
                        className="press-release-headline"
                        placeholder="Enter compelling headline (60 chars max for AI optimization)..."
                        value={attributes.headline}
                        onChange={(headline) => setAttributes({ headline })}
                    />

                    <RichText
                        tagName="h2"
                        className="press-release-subheadline"
                        placeholder="Supporting subheadline..."
                        value={attributes.subheadline}
                        onChange={(subheadline) => setAttributes({ subheadline })}
                    />

                    {showAICoach && (
                        <AICoachPanel suggestions={aiSuggestions} onClose={() => setShowAICoach(false)} />
                    )}

                    {aiSuggestions.length > 0 && (
                        <div className="ai-suggestions-inline">
                            {aiSuggestions.map((suggestion, index) => (
                                <Notice
                                    key={index}
                                    status={suggestion.type === 'warning' ? 'warning' : 'info'}
                                    isDismissible={false}
                                >
                                    <strong>{suggestion.message}</strong>
                                    <br />
                                    💡 {suggestion.fix}
                                </Notice>
                            ))}
                        </div>
                    )}
                </div>

                <script type="application/ld+json" dangerouslySetInnerHTML={{ 
                    __html: JSON.stringify(attributes.schemaMarkup, null, 2) 
                }} />
            </>
        );
    },

    save: ({ attributes }) => {
        return (
            <div className="press-release-header-block">
                {attributes.embargo && (
                    <div className="embargo-notice">
                        EMBARGOED UNTIL: {new Date(attributes.embargo).toLocaleString()}
                    </div>
                )}
                
                <div className="press-release-meta">
                    <span className="for-immediate-release">FOR IMMEDIATE RELEASE</span>
                    <span className="dateline">{attributes.dateline}</span>
                    <span className="date">{new Date().toLocaleDateString()}</span>
                </div>

                <h1 className="press-release-headline">{attributes.headline}</h1>
                <h2 className="press-release-subheadline">{attributes.subheadline}</h2>

                <script type="application/ld+json" dangerouslySetInnerHTML={{ 
                    __html: JSON.stringify(attributes.schemaMarkup, null, 2) 
                }} />
            </div>
        );
    }
});
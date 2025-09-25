import { useState, useEffect } from '@wordpress/element';
import { Card, CardBody, Button, Modal, TextControl, SelectControl, RangeControl } from '@wordpress/components';

export class QuoteGenerator {
    constructor(candidateProfile = {}) {
        this.candidateProfile = {
            name: candidateProfile.name || 'Candidate',
            title: candidateProfile.title || 'Candidate',
            party: candidateProfile.party || 'Independent',
            voiceCharacteristics: candidateProfile.voiceCharacteristics || {
                tone: 'professional-warm',
                complexity: 'accessible',
                personalTouch: 'moderate',
                directness: 'high',
                optimism: 'high'
            },
            keyPhrases: candidateProfile.keyPhrases || [
                'hardworking families',
                'our community',
                'moving forward',
                'real solutions',
                'bringing people together'
            ],
            issuePositions: candidateProfile.issuePositions || {},
            biography: candidateProfile.biography || {}
        };
        this.generatedQuotes = [];
        this.quoteHistory = [];
    }

    // Main quote generation method
    async generateQuotes(context, options = {}) {
        const {
            topic = 'general',
            documentType = 'press_release',
            tone = this.candidateProfile.voiceCharacteristics.tone,
            count = 3,
            length = 'medium', // short, medium, long
            includePersonalTouch = true
        } = options;

        const quotes = [];

        try {
            // Generate multiple quote variations
            for (let i = 0; i < count; i++) {
                const quote = await this.generateSingleQuote(topic, {
                    documentType,
                    tone,
                    length,
                    includePersonalTouch,
                    variation: i
                });
                quotes.push(quote);
            }

            // Store generated quotes
            this.generatedQuotes.push({
                id: `quote_gen_${Date.now()}`,
                context,
                options,
                quotes,
                generatedAt: new Date().toISOString()
            });

            return quotes;

        } catch (error) {
            console.error('Quote generation failed:', error);
            return this.getFallbackQuotes(topic, context);
        }
    }

    // Generate a single quote
    async generateSingleQuote(topic, options) {
        const { tone, length, includePersonalTouch, variation, documentType } = options;
        
        // Base quote structure based on topic
        const baseQuotes = this.getBaseQuotes(topic, documentType);
        const selectedBase = baseQuotes[variation % baseQuotes.length];

        // Apply candidate voice characteristics
        let quote = this.applyVoiceCharacteristics(selectedBase, tone);

        // Adjust length
        quote = this.adjustQuoteLength(quote, length);

        // Add personal touch if requested
        if (includePersonalTouch) {
            quote = this.addPersonalTouch(quote, topic);
        }

        // Apply candidate-specific phrases
        quote = this.incorporateKeyPhrases(quote);

        // Ensure proper attribution format
        quote = this.formatAttribution(quote);

        return {
            id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: quote,
            topic,
            tone,
            length,
            confidence: this.calculateQuoteConfidence(quote),
            voiceMatch: this.calculateVoiceMatch(quote),
            suggestedContext: this.getSuggestedContext(quote, topic),
            alternatives: this.generateMinorVariations(quote)
        };
    }

    // Get base quote templates by topic
    getBaseQuotes(topic, documentType) {
        const quoteTemplates = {
            healthcare: [
                "Healthcare is a fundamental right, and every family in our community deserves access to quality, affordable care.",
                "We're going to make sure that no one has to choose between paying for medicine and putting food on the table.",
                "This healthcare initiative represents our commitment to building a healthier, stronger community for everyone."
            ],
            infrastructure: [
                "Investing in infrastructure means investing in our future - better roads, better jobs, and better opportunities.",
                "When we rebuild our infrastructure, we're not just fixing roads and bridges, we're rebuilding the foundation for economic growth.",
                "This infrastructure plan will create good-paying jobs while making our community safer and more connected."
            ],
            economy: [
                "We're going to build an economy that works for everyone, not just those at the top.",
                "Every hardworking family deserves the opportunity to get ahead and build a better life.",
                "Our economic plan focuses on creating jobs, supporting small businesses, and strengthening the middle class."
            ],
            education: [
                "Every child deserves a world-class education, regardless of their zip code or family income.",
                "We're going to invest in our teachers, our schools, and our students because they are our future.",
                "Education is the great equalizer, and we must ensure every student has the tools they need to succeed."
            ],
            environment: [
                "We have a responsibility to protect our environment for future generations while creating clean energy jobs today.",
                "Climate action and economic opportunity go hand in hand - we can build a cleaner, more prosperous future.",
                "Environmental protection isn't just good policy, it's about ensuring our children inherit a livable planet."
            ],
            general: [
                "This is about bringing real solutions to the challenges facing our community.",
                "We're going to move forward together, because that's how we get things done.",
                "This represents our commitment to building a stronger, more prosperous future for everyone."
            ]
        };

        return quoteTemplates[topic] || quoteTemplates.general;
    }

    // Apply candidate voice characteristics
    applyVoiceCharacteristics(baseQuote, tone) {
        const voice = this.candidateProfile.voiceCharacteristics;
        let quote = baseQuote;

        // Adjust for tone
        switch (tone) {
            case 'professional-warm':
                quote = quote.replace(/\bgoing to\b/g, 'committed to');
                quote = quote.replace(/\bWe're\b/g, 'We are');
                break;
            case 'conversational':
                quote = quote.replace(/\bcommitted to\b/g, 'going to');
                quote = quote.replace(/\bWe are\b/g, "We're");
                break;
            case 'formal':
                quote = quote.replace(/\bgoing to\b/g, 'will');
                quote = quote.replace(/\bWe're\b/g, 'We shall');
                break;
        }

        // Adjust for directness
        if (voice.directness === 'high') {
            quote = quote.replace(/\bI believe that\b/g, 'I know that');
            quote = quote.replace(/\bWe should\b/g, 'We will');
        }

        // Adjust for optimism
        if (voice.optimism === 'high') {
            quote = quote.replace(/\bchallenge\b/g, 'opportunity');
            quote = quote.replace(/\bproblem\b/g, 'challenge we can solve');
        }

        return quote;
    }

    // Adjust quote length
    adjustQuoteLength(quote, targetLength) {
        const words = quote.split(' ');
        
        switch (targetLength) {
            case 'short':
                if (words.length > 15) {
                    // Keep the most impactful part
                    const sentences = quote.split('.').filter(s => s.trim());
                    return sentences[0].trim() + '.';
                }
                break;
            case 'long':
                if (words.length < 25) {
                    // Add supporting detail
                    const additions = [
                        " That's what leadership means - taking action when it matters most.",
                        " This is the kind of change our community has been waiting for.",
                        " Together, we can make this vision a reality."
                    ];
                    const addition = additions[Math.floor(Math.random() * additions.length)];
                    return quote.replace('.', addition);
                }
                break;
        }
        
        return quote;
    }

    // Add personal touches based on candidate biography
    addPersonalTouch(quote, topic) {
        const personalTouches = {
            healthcare: [
                "As someone who has seen firsthand how healthcare costs impact families",
                "Having worked with healthcare providers throughout my career",
                "From my experience serving on the health committee"
            ],
            infrastructure: [
                "As someone who commutes these roads every day",
                "Having seen how poor infrastructure holds back our local businesses",
                "From my background in urban planning"
            ],
            education: [
                "As a parent in this community",
                "Having served on the school board",
                "As someone who believes deeply in public education"
            ]
        };

        const touches = personalTouches[topic];
        if (touches && Math.random() > 0.5) {
            const touch = touches[Math.floor(Math.random() * touches.length)];
            return `${touch}, ${quote.charAt(0).toLowerCase() + quote.slice(1)}`;
        }

        return quote;
    }

    // Incorporate candidate key phrases
    incorporateKeyPhrases(quote) {
        const phrases = this.candidateProfile.keyPhrases;
        let modifiedQuote = quote;

        // Replace generic terms with candidate-specific phrases
        modifiedQuote = modifiedQuote.replace(/\bfamilies\b/g, 'hardworking families');
        modifiedQuote = modifiedQuote.replace(/\bpeople\b/g, 'our community');
        modifiedQuote = modifiedQuote.replace(/\bforward\b/g, 'moving forward');

        // Occasionally add a key phrase
        if (Math.random() > 0.7) {
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            modifiedQuote = modifiedQuote.replace('.', ` - that's what ${randomPhrase} means to me.`);
        }

        return modifiedQuote;
    }

    // Format attribution
    formatAttribution(quote) {
        const name = this.candidateProfile.name;
        const title = this.candidateProfile.title;
        
        // Ensure quote ends with proper attribution
        if (!quote.includes(' - ') && !quote.includes(name)) {
            return `"${quote}" - ${name}, ${title}`;
        }
        
        return quote;
    }

    // Calculate confidence score for generated quote
    calculateQuoteConfidence(quote) {
        let confidence = 0.7; // Base confidence
        
        // Check for candidate key phrases
        const keyPhraseCount = this.candidateProfile.keyPhrases.filter(phrase => 
            quote.toLowerCase().includes(phrase.toLowerCase())
        ).length;
        confidence += keyPhraseCount * 0.05;

        // Check quote length (ideal 15-30 words)
        const wordCount = quote.split(' ').length;
        if (wordCount >= 15 && wordCount <= 30) {
            confidence += 0.1;
        }

        // Check for action-oriented language
        if (quote.match(/\b(will|commit|ensure|build|create|invest)\b/i)) {
            confidence += 0.1;
        }

        return Math.min(1, confidence);
    }

    // Calculate voice match score
    calculateVoiceMatch(quote) {
        let score = 0.7; // Base score
        
        const voice = this.candidateProfile.voiceCharacteristics;
        
        // Check tone match
        if (voice.tone === 'professional-warm' && quote.match(/\b(commit|ensure|together)\b/i)) {
            score += 0.1;
        }
        
        // Check directness
        if (voice.directness === 'high' && quote.match(/\b(will|must|going to)\b/i)) {
            score += 0.1;
        }

        // Check optimism
        if (voice.optimism === 'high' && quote.match(/\b(opportunity|future|better|stronger)\b/i)) {
            score += 0.1;
        }

        return Math.min(1, score);
    }

    // Get suggested context for quote usage
    getSuggestedContext(quote, topic) {
        const contexts = {
            healthcare: 'Use in healthcare-related press releases, town halls, or policy announcements',
            infrastructure: 'Ideal for infrastructure project announcements or economic development events',
            education: 'Perfect for education policy releases or school visits',
            general: 'Versatile quote suitable for various campaign communications'
        };

        return contexts[topic] || contexts.general;
    }

    // Generate minor variations of a quote
    generateMinorVariations(baseQuote) {
        const variations = [];
        
        // Variation 1: Change verb tense
        let variation1 = baseQuote.replace(/\bwill\b/g, 'are going to');
        variation1 = variation1.replace(/\bare going to\b/g, 'will');
        variations.push(variation1);

        // Variation 2: Add emphasis
        let variation2 = baseQuote.replace(/\bThis\b/, 'This important initiative');
        variations.push(variation2);

        // Variation 3: More personal
        let variation3 = baseQuote.replace(/\bWe\b/, 'I');
        variation3 = variation3.replace(/\bour\b/g, 'my');
        variations.push(variation3);

        return variations.filter(v => v !== baseQuote && v.length > 10);
    }

    // Get fallback quotes if generation fails
    getFallbackQuotes(topic, context) {
        return [
            {
                id: 'fallback_1',
                text: `"This initiative represents our commitment to moving forward together as a community." - ${this.candidateProfile.name}`,
                topic,
                confidence: 0.6,
                voiceMatch: 0.7,
                alternatives: []
            }
        ];
    }

    // Save a quote to history
    saveQuoteToHistory(quote, context, action = 'used') {
        this.quoteHistory.push({
            quote,
            context,
            action,
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser()
        });
    }

    // Analyze quote usage patterns
    getQuoteAnalytics() {
        const used = this.quoteHistory.filter(q => q.action === 'used').length;
        const rejected = this.quoteHistory.filter(q => q.action === 'rejected').length;
        const modified = this.quoteHistory.filter(q => q.action === 'modified').length;

        return {
            totalGenerated: this.generatedQuotes.length,
            totalUsed: used,
            totalRejected: rejected,
            totalModified: modified,
            acceptanceRate: used + modified > 0 ? (used + modified) / (used + rejected + modified) : 0
        };
    }

    getCurrentUser() {
        return { id: 1, name: 'Media Associate' };
    }
}

// React component for quote generation interface
export const QuoteGeneratorPanel = ({ topic, context, onQuoteSelect, onClose }) => {
    const [quotes, setQuotes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [customization, setCustomization] = useState({
        tone: 'professional-warm',
        length: 'medium',
        count: 3,
        includePersonalTouch: true
    });
    const [showCustomization, setShowCustomization] = useState(false);

    // Initialize quote generator with candidate profile
    const candidateProfile = {
        name: 'Jane Smith',
        title: 'Candidate for Governor',
        party: 'Democratic',
        voiceCharacteristics: {
            tone: 'professional-warm',
            complexity: 'accessible',
            personalTouch: 'high',
            directness: 'high',
            optimism: 'high'
        },
        keyPhrases: [
            'hardworking families',
            'our community',
            'moving forward',
            'real solutions',
            'bringing people together'
        ]
    };

    const generator = new QuoteGenerator(candidateProfile);

    const generateQuotes = async () => {
        setIsGenerating(true);
        try {
            const newQuotes = await generator.generateQuotes(context, {
                topic,
                ...customization
            });
            setQuotes(newQuotes);
        } catch (error) {
            console.error('Quote generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleQuoteSelect = (quote, action = 'used') => {
        generator.saveQuoteToHistory(quote, context, action);
        if (onQuoteSelect) onQuoteSelect(quote, action);
    };

    const modifyQuote = (quote) => {
        const modified = prompt('Edit this quote:', quote.text);
        if (modified && modified !== quote.text) {
            const modifiedQuote = { ...quote, text: modified, modified: true };
            handleQuoteSelect(modifiedQuote, 'modified');
        }
    };

    useEffect(() => {
        generateQuotes();
    }, [topic]);

    if (isGenerating) {
        return (
            <Card className="quote-generator-panel">
                <CardBody>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <h3>Generating Quotes</h3>
                        <p style={{ color: '#64748b', marginBottom: '20px' }}>
                            Creating quotes in {candidateProfile.name}'s voice...
                        </p>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            <div>✓ Analyzing candidate voice patterns...</div>
                            <div>✓ Incorporating key phrases and messaging...</div>
                            <div>⏳ Generating {customization.count} quote variations...</div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="quote-generator-panel">
            <Card>
                <CardBody>
                    <div className="generator-header">
                        <h3>💬 Quote Generator</h3>
                        <div className="header-actions">
                            <Button 
                                isSecondary 
                                isSmall
                                onClick={() => setShowCustomization(!showCustomization)}
                            >
                                ⚙️ Customize
                            </Button>
                            <Button isSmall onClick={onClose}>×</Button>
                        </div>
                    </div>

                    {showCustomization && (
                        <div className="customization-panel">
                            <SelectControl
                                label="Tone"
                                value={customization.tone}
                                options={[
                                    { label: 'Professional & Warm', value: 'professional-warm' },
                                    { label: 'Conversational', value: 'conversational' },
                                    { label: 'Formal', value: 'formal' },
                                    { label: 'Inspirational', value: 'inspirational' }
                                ]}
                                onChange={(tone) => setCustomization({ ...customization, tone })}
                            />
                            
                            <SelectControl
                                label="Length"
                                value={customization.length}
                                options={[
                                    { label: 'Short (10-15 words)', value: 'short' },
                                    { label: 'Medium (15-25 words)', value: 'medium' },
                                    { label: 'Long (25+ words)', value: 'long' }
                                ]}
                                onChange={(length) => setCustomization({ ...customization, length })}
                            />

                            <RangeControl
                                label="Number of Quotes"
                                value={customization.count}
                                onChange={(count) => setCustomization({ ...customization, count })}
                                min={1}
                                max={5}
                            />

                            <Button isPrimary onClick={generateQuotes}>
                                🔄 Regenerate Quotes
                            </Button>
                        </div>
                    )}

                    <div className="candidate-voice-info">
                        <h4>🎯 Candidate Voice Profile</h4>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                            <strong>{candidateProfile.name}</strong> • {candidateProfile.voiceCharacteristics.tone} tone • 
                            Emphasizes: {candidateProfile.keyPhrases.slice(0, 2).join(', ')}
                        </div>
                    </div>

                    <div className="generated-quotes">
                        {quotes.map((quote, index) => (
                            <div key={quote.id} className="quote-option">
                                <div className="quote-header">
                                    <span className="quote-number">Quote {index + 1}</span>
                                    <div className="quote-metrics">
                                        <span className="confidence-score">
                                            {Math.round(quote.confidence * 100)}% confident
                                        </span>
                                        <span className="voice-match">
                                            {Math.round(quote.voiceMatch * 100)}% voice match
                                        </span>
                                    </div>
                                </div>

                                <div className="quote-text">
                                    {quote.text}
                                </div>

                                <div className="quote-context">
                                    <strong>Best for:</strong> {quote.suggestedContext}
                                </div>

                                {quote.alternatives && quote.alternatives.length > 0 && (
                                    <details className="quote-alternatives">
                                        <summary>Alternative versions ({quote.alternatives.length})</summary>
                                        <div className="alternatives-list">
                                            {quote.alternatives.map((alt, i) => (
                                                <div key={i} className="alternative-quote">
                                                    {alt}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}

                                <div className="quote-actions">
                                    <Button 
                                        isPrimary 
                                        isSmall
                                        onClick={() => handleQuoteSelect(quote, 'used')}
                                    >
                                        ✅ Use This Quote
                                    </Button>
                                    
                                    <Button 
                                        isSecondary 
                                        isSmall
                                        onClick={() => modifyQuote(quote)}
                                    >
                                        ✏️ Edit Quote
                                    </Button>
                                    
                                    <Button 
                                        isTertiary 
                                        isSmall
                                        onClick={() => handleQuoteSelect(quote, 'rejected')}
                                    >
                                        ❌ Not Right
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="generation-footer">
                        <Button onClick={generateQuotes}>
                            🔄 Generate More Quotes
                        </Button>
                        
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                            All quotes are generated to match {candidateProfile.name}'s established voice and messaging.
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};
// Content Block Definitions for Different Assignment Types
// Defines the block structure for each type of content

const contentBlockTemplates = {
    // Press Release block structure
    'press-release': [
        {
            id: 'pr-header',
            type: 'header',
            label: 'Header Information',
            required: true,
            fields: ['FOR IMMEDIATE RELEASE', 'Contact Information'],
            editableBy: ['press_secretary', 'communications_director'],
            lockable: true
        },
        {
            id: 'pr-headline',
            type: 'headline',
            label: 'Headline',
            required: true,
            maxLength: 100,
            lockable: true,
            qualityChecks: ['ap_style', 'character_count']
        },
        {
            id: 'pr-subheadline',
            type: 'subheadline',
            label: 'Subheadline',
            required: false,
            maxLength: 150,
            lockable: true
        },
        {
            id: 'pr-dateline',
            type: 'dateline',
            label: 'Dateline',
            required: true,
            format: 'CITY, State - Date',
            lockable: true
        },
        {
            id: 'pr-lead',
            type: 'lead',
            label: 'Lead Paragraph',
            required: true,
            wordCount: { min: 25, max: 50 },
            lockable: true,
            qualityChecks: ['readability', 'ap_style', 'fact_check']
        },
        {
            id: 'pr-body',
            type: 'body',
            label: 'Body Content',
            required: true,
            paragraphs: { min: 3, max: 5 },
            lockable: true,
            qualityChecks: ['readability', 'ap_style', 'fact_check', 'quote_attribution']
        },
        {
            id: 'pr-quote',
            type: 'quote',
            label: 'Key Quote',
            required: true,
            lockable: true,
            fields: ['quote_text', 'attribution', 'title']
        },
        {
            id: 'pr-boilerplate',
            type: 'boilerplate',
            label: 'About Section',
            required: true,
            lockable: true,
            template: 'campaign_boilerplate'
        },
        {
            id: 'pr-contact',
            type: 'contact',
            label: 'Media Contact',
            required: true,
            lockable: false, // Usually standardized
            fields: ['name', 'email', 'phone']
        }
    ],

    // Op-Ed block structure
    'op-ed': [
        {
            id: 'oped-headline',
            type: 'headline',
            label: 'Headline',
            required: true,
            maxLength: 80,
            lockable: true,
            qualityChecks: ['hook_strength', 'clarity']
        },
        {
            id: 'oped-byline',
            type: 'byline',
            label: 'Author Byline',
            required: true,
            lockable: true,
            fields: ['author_name', 'author_title']
        },
        {
            id: 'oped-hook',
            type: 'hook',
            label: 'Opening Hook',
            required: true,
            wordCount: { min: 50, max: 100 },
            lockable: true,
            qualityChecks: ['engagement', 'clarity']
        },
        {
            id: 'oped-thesis',
            type: 'thesis',
            label: 'Thesis Statement',
            required: true,
            wordCount: { min: 30, max: 60 },
            lockable: true,
            qualityChecks: ['clarity', 'argument_strength']
        },
        {
            id: 'oped-argument-1',
            type: 'argument',
            label: 'First Argument',
            required: true,
            wordCount: { min: 150, max: 200 },
            lockable: true,
            qualityChecks: ['logic', 'evidence', 'persuasion']
        },
        {
            id: 'oped-argument-2',
            type: 'argument',
            label: 'Second Argument',
            required: true,
            wordCount: { min: 150, max: 200 },
            lockable: true,
            qualityChecks: ['logic', 'evidence', 'persuasion']
        },
        {
            id: 'oped-argument-3',
            type: 'argument',
            label: 'Third Argument',
            required: false,
            wordCount: { min: 150, max: 200 },
            lockable: true,
            qualityChecks: ['logic', 'evidence', 'persuasion']
        },
        {
            id: 'oped-counter',
            type: 'counter-argument',
            label: 'Address Counter-Arguments',
            required: true,
            wordCount: { min: 100, max: 150 },
            lockable: true,
            qualityChecks: ['fairness', 'rebuttal_strength']
        },
        {
            id: 'oped-conclusion',
            type: 'conclusion',
            label: 'Conclusion & Call to Action',
            required: true,
            wordCount: { min: 75, max: 125 },
            lockable: true,
            qualityChecks: ['impact', 'clarity', 'cta_strength']
        },
        {
            id: 'oped-bio',
            type: 'author-bio',
            label: 'Author Bio',
            required: true,
            wordCount: { max: 50 },
            lockable: true
        }
    ],

    // Speech block structure
    'speech': [
        {
            id: 'speech-opening',
            type: 'opening',
            label: 'Opening/Acknowledgments',
            required: true,
            duration: { min: 30, max: 60 }, // seconds
            lockable: true,
            qualityChecks: ['audience_appropriate', 'energy']
        },
        {
            id: 'speech-hook',
            type: 'hook',
            label: 'Attention Grabber',
            required: true,
            duration: { min: 20, max: 40 },
            lockable: true,
            qualityChecks: ['engagement', 'memorability']
        },
        {
            id: 'speech-context',
            type: 'context',
            label: 'Context Setting',
            required: true,
            duration: { min: 60, max: 90 },
            lockable: true,
            qualityChecks: ['clarity', 'relevance']
        },
        {
            id: 'speech-point-1',
            type: 'main-point',
            label: 'First Main Point',
            required: true,
            duration: { min: 120, max: 180 },
            lockable: true,
            qualityChecks: ['clarity', 'evidence', 'delivery_notes']
        },
        {
            id: 'speech-story-1',
            type: 'story',
            label: 'Personal Story/Example',
            required: true,
            duration: { min: 60, max: 120 },
            lockable: true,
            qualityChecks: ['authenticity', 'relevance', 'emotional_connection']
        },
        {
            id: 'speech-point-2',
            type: 'main-point',
            label: 'Second Main Point',
            required: true,
            duration: { min: 120, max: 180 },
            lockable: true,
            qualityChecks: ['clarity', 'evidence', 'delivery_notes']
        },
        {
            id: 'speech-point-3',
            type: 'main-point',
            label: 'Third Main Point',
            required: false,
            duration: { min: 120, max: 180 },
            lockable: true,
            qualityChecks: ['clarity', 'evidence', 'delivery_notes']
        },
        {
            id: 'speech-vision',
            type: 'vision',
            label: 'Vision for Future',
            required: true,
            duration: { min: 90, max: 120 },
            lockable: true,
            qualityChecks: ['inspiration', 'specificity', 'achievability']
        },
        {
            id: 'speech-cta',
            type: 'call-to-action',
            label: 'Call to Action',
            required: true,
            duration: { min: 60, max: 90 },
            lockable: true,
            qualityChecks: ['clarity', 'actionability', 'urgency']
        },
        {
            id: 'speech-closing',
            type: 'closing',
            label: 'Memorable Closing',
            required: true,
            duration: { min: 30, max: 60 },
            lockable: true,
            qualityChecks: ['impact', 'memorability', 'callback']
        }
    ],

    // Social Media block structure
    'social-media': [
        {
            id: 'social-platform',
            type: 'platform-selector',
            label: 'Platform Selection',
            required: true,
            options: ['Twitter/X', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok'],
            lockable: false
        },
        {
            id: 'social-main',
            type: 'main-content',
            label: 'Main Post Content',
            required: true,
            characterLimits: {
                'Twitter/X': 280,
                'Facebook': 500,
                'Instagram': 2200,
                'LinkedIn': 3000,
                'TikTok': 150
            },
            lockable: true,
            qualityChecks: ['engagement', 'hashtag_relevance', 'tone']
        },
        {
            id: 'social-visual',
            type: 'visual-content',
            label: 'Image/Video Selection',
            required: true,
            lockable: true,
            specs: {
                'Twitter/X': { aspect: '16:9', size: '5MB' },
                'Facebook': { aspect: '1.91:1', size: '4GB' },
                'Instagram': { aspect: '1:1', size: '100MB' },
                'LinkedIn': { aspect: '1.91:1', size: '5GB' },
                'TikTok': { aspect: '9:16', size: '287MB' }
            }
        },
        {
            id: 'social-hashtags',
            type: 'hashtags',
            label: 'Hashtags',
            required: true,
            limits: {
                'Twitter/X': 3,
                'Facebook': 3,
                'Instagram': 30,
                'LinkedIn': 5,
                'TikTok': 5
            },
            lockable: true,
            qualityChecks: ['trending', 'relevance', 'campaign_consistency']
        },
        {
            id: 'social-thread',
            type: 'thread',
            label: 'Thread/Carousel Content',
            required: false,
            maxItems: 10,
            lockable: true
        },
        {
            id: 'social-cta',
            type: 'call-to-action',
            label: 'Call to Action',
            required: true,
            lockable: true,
            options: ['Learn More', 'Sign Up', 'Donate', 'Share', 'Comment', 'Visit Website']
        },
        {
            id: 'social-timing',
            type: 'timing',
            label: 'Post Timing',
            required: true,
            lockable: false,
            fields: ['date', 'time', 'timezone']
        }
    ],

    // Talking Points block structure
    'talking-points': [
        {
            id: 'tp-topic',
            type: 'topic',
            label: 'Topic/Issue',
            required: true,
            lockable: false
        },
        {
            id: 'tp-position',
            type: 'position-statement',
            label: 'Core Position',
            required: true,
            wordCount: { min: 25, max: 50 },
            lockable: true,
            qualityChecks: ['clarity', 'consistency']
        },
        {
            id: 'tp-key-message-1',
            type: 'key-message',
            label: 'Key Message 1',
            required: true,
            wordCount: { max: 30 },
            lockable: true,
            qualityChecks: ['memorability', 'clarity']
        },
        {
            id: 'tp-key-message-2',
            type: 'key-message',
            label: 'Key Message 2',
            required: true,
            wordCount: { max: 30 },
            lockable: true,
            qualityChecks: ['memorability', 'clarity']
        },
        {
            id: 'tp-key-message-3',
            type: 'key-message',
            label: 'Key Message 3',
            required: true,
            wordCount: { max: 30 },
            lockable: true,
            qualityChecks: ['memorability', 'clarity']
        },
        {
            id: 'tp-supporting-facts',
            type: 'supporting-facts',
            label: 'Supporting Facts/Statistics',
            required: true,
            items: { min: 3, max: 5 },
            lockable: true,
            qualityChecks: ['accuracy', 'source_verification']
        },
        {
            id: 'tp-bridge-phrases',
            type: 'bridge-phrases',
            label: 'Bridge/Pivot Phrases',
            required: true,
            items: { min: 2, max: 4 },
            lockable: true,
            examples: ['What's important to understand is...', 'The real issue here is...']
        },
        {
            id: 'tp-difficult-questions',
            type: 'difficult-questions',
            label: 'Anticipated Difficult Questions',
            required: true,
            items: { min: 3, max: 5 },
            lockable: true
        },
        {
            id: 'tp-responses',
            type: 'responses',
            label: 'Prepared Responses',
            required: true,
            items: { min: 3, max: 5 },
            lockable: true,
            qualityChecks: ['defensive_tone', 'message_consistency']
        },
        {
            id: 'tp-do-not-say',
            type: 'avoid-list',
            label: 'Phrases to Avoid',
            required: true,
            lockable: true
        }
    ],

    // Email/Newsletter block structure
    'email': [
        {
            id: 'email-subject',
            type: 'subject-line',
            label: 'Subject Line',
            required: true,
            maxLength: 60,
            lockable: true,
            qualityChecks: ['open_rate_optimization', 'clarity']
        },
        {
            id: 'email-preheader',
            type: 'preheader',
            label: 'Preheader Text',
            required: true,
            maxLength: 100,
            lockable: true
        },
        {
            id: 'email-greeting',
            type: 'greeting',
            label: 'Personalized Greeting',
            required: true,
            lockable: true,
            personalization: ['first_name', 'location', 'interest']
        },
        {
            id: 'email-lead',
            type: 'lead',
            label: 'Lead Paragraph',
            required: true,
            wordCount: { min: 40, max: 80 },
            lockable: true
        },
        {
            id: 'email-main',
            type: 'main-content',
            label: 'Main Message',
            required: true,
            wordCount: { min: 150, max: 300 },
            lockable: true
        },
        {
            id: 'email-cta',
            type: 'call-to-action',
            label: 'Primary CTA',
            required: true,
            lockable: true,
            fields: ['button_text', 'link_url', 'button_color']
        },
        {
            id: 'email-secondary',
            type: 'secondary-content',
            label: 'Secondary Content/Updates',
            required: false,
            lockable: true
        },
        {
            id: 'email-footer',
            type: 'footer',
            label: 'Footer/Unsubscribe',
            required: true,
            lockable: false,
            template: 'standard_footer'
        }
    ],

    // Letter block structure
    'letter': [
        {
            id: 'letter-recipient',
            type: 'recipient',
            label: 'Recipient Information',
            required: true,
            lockable: true,
            fields: ['name', 'title', 'organization', 'address']
        },
        {
            id: 'letter-date',
            type: 'date',
            label: 'Date',
            required: true,
            lockable: false,
            format: 'formal'
        },
        {
            id: 'letter-salutation',
            type: 'salutation',
            label: 'Salutation',
            required: true,
            lockable: true,
            options: ['Dear', 'To', 'Honorable']
        },
        {
            id: 'letter-opening',
            type: 'opening',
            label: 'Opening Paragraph',
            required: true,
            wordCount: { min: 50, max: 100 },
            lockable: true
        },
        {
            id: 'letter-body-1',
            type: 'body',
            label: 'Body Paragraph 1',
            required: true,
            wordCount: { min: 100, max: 150 },
            lockable: true
        },
        {
            id: 'letter-body-2',
            type: 'body',
            label: 'Body Paragraph 2',
            required: false,
            wordCount: { min: 100, max: 150 },
            lockable: true
        },
        {
            id: 'letter-request',
            type: 'request',
            label: 'Specific Request/Ask',
            required: true,
            wordCount: { min: 50, max: 100 },
            lockable: true
        },
        {
            id: 'letter-closing',
            type: 'closing',
            label: 'Closing Paragraph',
            required: true,
            wordCount: { min: 30, max: 60 },
            lockable: true
        },
        {
            id: 'letter-signature',
            type: 'signature',
            label: 'Signature Block',
            required: true,
            lockable: false,
            fields: ['closing_phrase', 'name', 'title']
        }
    ]
};

// Function to get blocks for a specific assignment type
function getBlocksForType(assignmentType) {
    return contentBlockTemplates[assignmentType] || contentBlockTemplates['press-release'];
}

// Function to get editable blocks for a specific role
function getEditableBlocksForRole(assignmentType, role) {
    const blocks = getBlocksForType(assignmentType);
    const editableBlocks = [];

    for (const block of blocks) {
        // Check if block has role restrictions
        if (block.editableBy) {
            if (block.editableBy.includes(role)) {
                editableBlocks.push(block);
            }
        } else {
            // No restrictions, anyone can edit
            editableBlocks.push(block);
        }
    }

    return editableBlocks;
}

// Function to validate block content
function validateBlockContent(block, content) {
    const errors = [];

    // Check word count
    if (block.wordCount) {
        const wordCount = content.split(' ').length;
        if (block.wordCount.min && wordCount < block.wordCount.min) {
            errors.push(`Minimum ${block.wordCount.min} words required`);
        }
        if (block.wordCount.max && wordCount > block.wordCount.max) {
            errors.push(`Maximum ${block.wordCount.max} words allowed`);
        }
    }

    // Check character count
    if (block.maxLength && content.length > block.maxLength) {
        errors.push(`Maximum ${block.maxLength} characters allowed`);
    }

    // Check required fields
    if (block.required && (!content || content.trim() === '')) {
        errors.push('This block is required');
    }

    return errors;
}

module.exports = {
    contentBlockTemplates,
    getBlocksForType,
    getEditableBlocksForRole,
    validateBlockContent
};
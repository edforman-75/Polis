// Two-Layer Block Structure System
// Layer 1: Technical blocks (WordPress-style)
// Layer 2: Narrative/content blocks (assignment-specific flow)

// LAYER 1: TECHNICAL BLOCK TYPES (Universal across all content)
const technicalBlocks = {
    // Text blocks
    'text/paragraph': {
        type: 'text/paragraph',
        label: 'Paragraph',
        icon: '📝',
        editable: true,
        lockable: true,
        attributes: {
            content: { type: 'string' },
            alignment: { type: 'string', default: 'left' },
            dropCap: { type: 'boolean', default: false }
        }
    },
    'text/heading': {
        type: 'text/heading',
        label: 'Heading',
        icon: '📌',
        editable: true,
        lockable: true,
        attributes: {
            content: { type: 'string' },
            level: { type: 'number', default: 2, min: 1, max: 6 }
        }
    },
    'text/quote': {
        type: 'text/quote',
        label: 'Quote',
        icon: '💬',
        editable: true,
        lockable: true,
        attributes: {
            quote: { type: 'string' },
            citation: { type: 'string' },
            citationTitle: { type: 'string' }
        }
    },
    'text/list': {
        type: 'text/list',
        label: 'List',
        icon: '📋',
        editable: true,
        lockable: true,
        attributes: {
            items: { type: 'array' },
            ordered: { type: 'boolean', default: false }
        }
    },

    // Media blocks
    'media/image': {
        type: 'media/image',
        label: 'Image',
        icon: '🖼️',
        editable: true,
        lockable: true,
        attributes: {
            src: { type: 'string' },
            alt: { type: 'string' },
            caption: { type: 'string' },
            alignment: { type: 'string', default: 'center' }
        }
    },
    'media/video': {
        type: 'media/video',
        label: 'Video',
        icon: '🎥',
        editable: true,
        lockable: true,
        attributes: {
            src: { type: 'string' },
            poster: { type: 'string' },
            caption: { type: 'string' }
        }
    },

    // Layout blocks
    'layout/columns': {
        type: 'layout/columns',
        label: 'Columns',
        icon: '📊',
        editable: true,
        lockable: true,
        attributes: {
            columns: { type: 'number', default: 2 },
            columnWidths: { type: 'array' }
        }
    },
    'layout/separator': {
        type: 'layout/separator',
        label: 'Separator',
        icon: '➖',
        editable: false,
        lockable: false,
        attributes: {
            style: { type: 'string', default: 'default' }
        }
    },

    // Special blocks
    'embed/social': {
        type: 'embed/social',
        label: 'Social Embed',
        icon: '🔗',
        editable: true,
        lockable: true,
        attributes: {
            url: { type: 'string' },
            platform: { type: 'string' }
        }
    },
    'data/statistic': {
        type: 'data/statistic',
        label: 'Statistic',
        icon: '📈',
        editable: true,
        lockable: true,
        attributes: {
            number: { type: 'string' },
            label: { type: 'string' },
            source: { type: 'string' },
            verified: { type: 'boolean', default: false }
        }
    },
    'campaign/callout': {
        type: 'campaign/callout',
        label: 'Callout Box',
        icon: '📢',
        editable: true,
        lockable: true,
        attributes: {
            content: { type: 'string' },
            style: { type: 'string', default: 'info' },
            icon: { type: 'string' }
        }
    },
    'campaign/cta': {
        type: 'campaign/cta',
        label: 'Call to Action',
        icon: '🎯',
        editable: true,
        lockable: true,
        attributes: {
            text: { type: 'string' },
            buttonText: { type: 'string' },
            url: { type: 'string' },
            style: { type: 'string', default: 'primary' }
        }
    },

    // Press Release Specific Blocks
    'text/subheading': {
        type: 'text/subheading',
        label: 'Subheading',
        icon: '📄',
        editable: true,
        lockable: true,
        attributes: {
            content: { type: 'string' },
            style: { type: 'string', default: 'italic' }
        }
    },
    'press/release-info': {
        type: 'press/release-info',
        label: 'Release Information',
        icon: '📅',
        editable: true,
        lockable: true,
        attributes: {
            releaseType: { type: 'string', default: 'FOR IMMEDIATE RELEASE' },
            embargoDate: { type: 'datetime-local' },
            embargoTime: { type: 'string' },
            releaseDate: { type: 'date' },
            location: { type: 'string' },
            customReleaseType: { type: 'string' }
        }
    },
    'press/about-selector': {
        type: 'press/about-selector',
        label: 'About Section Selector',
        icon: 'ℹ️',
        editable: true,
        lockable: true,
        attributes: {
            selectedTemplate: { type: 'string' },
            customContent: { type: 'string' },
            templates: {
                type: 'array',
                default: [
                    {
                        id: 'progressive-organizer',
                        name: 'Progressive Organizer',
                        content: '[Candidate Name] is a [background] and [community role] running for [Office] in [District]. [He/She] previously served as [previous role] and led successful campaigns for [key achievements]. [Candidate Name] believes [core belief] and has been endorsed by [endorsing organizations].'
                    },
                    {
                        id: 'healthcare-champion',
                        name: 'Healthcare Champion',
                        content: '[Candidate Name] is a healthcare advocate running for [Office] to ensure healthcare is a human right. As a [background], [he/she] has [healthcare experience] and is committed to Medicare for All. [Candidate Name] has been endorsed by [healthcare organizations].'
                    },
                    {
                        id: 'working-families',
                        name: 'Working Families Advocate',
                        content: '[Candidate Name] is running for [Office] to fight for working families in [District]. A [background] and [community connection], [he/she] understands the challenges facing [community type]. [Candidate Name] supports [key policies] and has the endorsement of [labor organizations].'
                    },
                    {
                        id: 'climate-justice',
                        name: 'Climate & Justice Focus',
                        content: '[Candidate Name] is running for [Office] on a platform of climate action and economic justice. As a [background], [he/she] has [relevant experience] and believes we need a Green New Deal with union jobs. [Candidate Name] is endorsed by [environmental/justice organizations].'
                    },
                    {
                        id: 'immigrant-background',
                        name: 'Immigrant Heritage',
                        content: '[Candidate Name] is a [generation] immigrant, [background], and [community role] running for [Office] in [District]. [He/She] previously [previous experience] and has fought for [key issues]. [Candidate Name] believes [core values] and represents the diversity of our district.'
                    }
                ]
            }
        }
    },
    'press/contact-info': {
        type: 'press/contact-info',
        label: 'Contact Information',
        icon: '📞',
        editable: true,
        lockable: true,
        attributes: {
            selectedTemplate: { type: 'string' },
            customContent: { type: 'string' },
            templates: {
                type: 'array',
                default: [
                    {
                        id: 'press-secretary',
                        name: 'Press Secretary Contact',
                        content: 'For media inquiries:\n[Press Secretary Name]\nPress Secretary\n[Campaign Name]\nPhone: [phone]\nEmail: [email]'
                    },
                    {
                        id: 'communications-director',
                        name: 'Communications Director',
                        content: 'Media Contact:\n[Communications Director Name]\nCommunications Director\n[Campaign Name]\nPhone: [phone]\nEmail: [email]\nWeb: [website]'
                    },
                    {
                        id: 'campaign-manager',
                        name: 'Campaign Manager Contact',
                        content: 'For further information:\n[Campaign Manager Name]\nCampaign Manager\n[Campaign Name]\nPhone: [phone]\nEmail: [email]'
                    },
                    {
                        id: 'dual-contact',
                        name: 'Dual Contact Points',
                        content: 'Media Inquiries:\n[Press Contact Name] - [phone] - [email]\n\nCampaign Information:\n[Campaign Contact Name] - [phone] - [email]'
                    },
                    {
                        id: 'detailed-contact',
                        name: 'Detailed Media Contact',
                        content: '[Contact Name], [Title]\n[Campaign Name]\nEmail: [email]\nPhone: [phone]\nWeb: [website]'
                    }
                ]
            }
        }
    },
    'press/paid-for': {
        type: 'press/paid-for',
        label: 'Paid For By',
        icon: '📋',
        editable: true,
        lockable: true,
        attributes: {
            content: { type: 'string', default: 'Paid for by [Campaign Name]' }
        }
    }
};

// LAYER 2: NARRATIVE STRUCTURES (Assignment-specific content flow)
const narrativeStructures = {
    'press-release': {
        name: 'Press Release',
        sections: [
            {
                id: 'release-info',
                label: 'Release Information',
                required: true,
                suggestedBlocks: ['press/release-info'],
                guidelines: 'Date, location, and release timing'
            },
            {
                id: 'headline',
                label: 'Headline',
                required: true,
                suggestedBlocks: ['text/heading'],
                guidelines: 'Strong, newsworthy headline under 100 characters'
            },
            {
                id: 'subhead',
                label: 'Subhead',
                required: false,
                suggestedBlocks: ['text/subheading'],
                guidelines: 'Supporting headline that expands on the main headline'
            },
            {
                id: 'lead',
                label: 'Lead Paragraph',
                required: true,
                suggestedBlocks: ['text/paragraph'],
                guidelines: 'Answer who, what, when, where, why in 25-50 words'
            },
            {
                id: 'body',
                label: 'Body Content',
                required: true,
                multiple: true,
                suggestedBlocks: ['text/paragraph', 'text/quote', 'data/statistic'],
                guidelines: '3-5 paragraphs with supporting details and quotes'
            },
            {
                id: 'quote',
                label: 'Key Quote',
                required: true,
                multiple: true,
                suggestedBlocks: ['text/quote'],
                guidelines: 'Compelling quotes from candidate or spokesperson'
            },
            {
                id: 'about',
                label: 'About Section',
                required: true,
                suggestedBlocks: ['press/about-selector'],
                guidelines: 'Standard campaign boilerplate from saved templates'
            },
            {
                id: 'contact',
                label: 'Media Contact',
                required: true,
                suggestedBlocks: ['press/contact-info'],
                guidelines: 'Media contact information from saved templates'
            },
            {
                id: 'paid-for',
                label: 'Paid For By',
                required: true,
                suggestedBlocks: ['press/paid-for'],
                guidelines: 'Legal campaign attribution line'
            }
        ]
    },

    'op-ed': {
        name: 'Op-Ed',
        sections: [
            {
                id: 'headline',
                label: 'Headline',
                required: true,
                suggestedBlocks: ['text/heading'],
                guidelines: 'Compelling headline that captures the argument'
            },
            {
                id: 'hook',
                label: 'Opening Hook',
                required: true,
                suggestedBlocks: ['text/paragraph', 'text/quote'],
                guidelines: 'Grab attention with story, statistic, or provocative question'
            },
            {
                id: 'thesis',
                label: 'Thesis Statement',
                required: true,
                suggestedBlocks: ['text/paragraph'],
                guidelines: 'Clear statement of your position'
            },
            {
                id: 'arguments',
                label: 'Supporting Arguments',
                required: true,
                multiple: true,
                suggestedBlocks: ['text/paragraph', 'data/statistic', 'text/quote', 'campaign/callout'],
                guidelines: '2-3 strong arguments with evidence'
            },
            {
                id: 'counter',
                label: 'Counter-Argument',
                required: true,
                suggestedBlocks: ['text/paragraph'],
                guidelines: 'Address and refute opposing views'
            },
            {
                id: 'conclusion',
                label: 'Conclusion',
                required: true,
                suggestedBlocks: ['text/paragraph', 'campaign/cta'],
                guidelines: 'Reinforce thesis and call to action'
            }
        ]
    },

    'speech': {
        name: 'Speech',
        sections: [
            {
                id: 'opening',
                label: 'Opening/Acknowledgments',
                required: true,
                suggestedBlocks: ['text/paragraph'],
                deliveryNotes: true,
                guidelines: 'Thank hosts, acknowledge attendees'
            },
            {
                id: 'hook',
                label: 'Attention Grabber',
                required: true,
                suggestedBlocks: ['text/paragraph', 'text/quote'],
                deliveryNotes: true,
                guidelines: 'Story or statement that connects with audience'
            },
            {
                id: 'roadmap',
                label: 'Speech Roadmap',
                required: false,
                suggestedBlocks: ['text/paragraph', 'text/list'],
                deliveryNotes: true,
                guidelines: 'Preview main points (optional)'
            },
            {
                id: 'main-points',
                label: 'Main Points',
                required: true,
                multiple: true,
                suggestedBlocks: ['text/heading', 'text/paragraph', 'text/quote', 'data/statistic'],
                deliveryNotes: true,
                guidelines: '2-3 main arguments or themes'
            },
            {
                id: 'stories',
                label: 'Personal Stories',
                required: true,
                suggestedBlocks: ['text/paragraph'],
                deliveryNotes: true,
                guidelines: 'Humanizing examples and anecdotes'
            },
            {
                id: 'vision',
                label: 'Vision Statement',
                required: true,
                suggestedBlocks: ['text/paragraph', 'campaign/callout'],
                deliveryNotes: true,
                guidelines: 'Paint picture of the future'
            },
            {
                id: 'call-to-action',
                label: 'Call to Action',
                required: true,
                suggestedBlocks: ['text/paragraph', 'campaign/cta'],
                deliveryNotes: true,
                guidelines: 'Specific ask of the audience'
            },
            {
                id: 'closing',
                label: 'Memorable Close',
                required: true,
                suggestedBlocks: ['text/paragraph', 'text/quote'],
                deliveryNotes: true,
                guidelines: 'Callback to opening or powerful final thought'
            }
        ]
    },

    'social-media': {
        name: 'Social Media',
        sections: [
            {
                id: 'main-post',
                label: 'Main Content',
                required: true,
                suggestedBlocks: ['text/paragraph'],
                platformSpecific: true,
                guidelines: 'Platform-appropriate length and tone'
            },
            {
                id: 'media',
                label: 'Visual Content',
                required: true,
                suggestedBlocks: ['media/image', 'media/video'],
                platformSpecific: true,
                guidelines: 'Eye-catching visuals optimized for platform'
            },
            {
                id: 'hashtags',
                label: 'Hashtags',
                required: true,
                suggestedBlocks: ['text/paragraph'],
                platformSpecific: true,
                guidelines: 'Relevant, trending hashtags'
            },
            {
                id: 'thread',
                label: 'Thread/Carousel',
                required: false,
                multiple: true,
                suggestedBlocks: ['text/paragraph', 'media/image'],
                guidelines: 'Additional content for threads or carousels'
            },
            {
                id: 'cta',
                label: 'Call to Action',
                required: true,
                suggestedBlocks: ['campaign/cta'],
                guidelines: 'Clear action for followers'
            }
        ]
    },

    'talking-points': {
        name: 'Talking Points',
        sections: [
            {
                id: 'topic',
                label: 'Topic/Issue',
                required: true,
                suggestedBlocks: ['text/heading'],
                guidelines: 'Clear topic identification'
            },
            {
                id: 'position',
                label: 'Core Position',
                required: true,
                suggestedBlocks: ['text/paragraph', 'campaign/callout'],
                guidelines: 'Our stance in 1-2 sentences'
            },
            {
                id: 'key-messages',
                label: 'Key Messages',
                required: true,
                multiple: true,
                suggestedBlocks: ['text/list'],
                guidelines: '3 memorable points'
            },
            {
                id: 'supporting-facts',
                label: 'Supporting Facts',
                required: true,
                suggestedBlocks: ['data/statistic', 'text/list'],
                guidelines: 'Verified statistics and facts'
            },
            {
                id: 'bridges',
                label: 'Bridge Phrases',
                required: true,
                suggestedBlocks: ['text/list'],
                guidelines: 'Phrases to pivot back to message'
            },
            {
                id: 'tough-questions',
                label: 'Q&A Preparation',
                required: true,
                suggestedBlocks: ['text/list', 'text/paragraph'],
                guidelines: 'Anticipated questions and responses'
            }
        ]
    }
};

// Helper function to combine technical blocks with narrative structure
function getEditorialStructure(assignmentType) {
    const narrative = narrativeStructures[assignmentType];
    if (!narrative) {
        throw new Error(`Unknown assignment type: ${assignmentType}`);
    }

    return {
        narrative: narrative,
        technicalBlocks: technicalBlocks,

        // Method to create a new section with technical blocks
        createSection: (sectionId) => {
            const section = narrative.sections.find(s => s.id === sectionId);
            if (!section) return null;

            return {
                ...section,
                blocks: section.suggestedBlocks.map(blockType => ({
                    ...technicalBlocks[blockType],
                    id: `${sectionId}-${blockType}-${Date.now()}`,
                    sectionId: sectionId,
                    locked: false,
                    lockedBy: null
                }))
            };
        },

        // Method to validate section content
        validateSection: (sectionId, content) => {
            const section = narrative.sections.find(s => s.id === sectionId);
            if (!section) return { valid: false, errors: ['Unknown section'] };

            const errors = [];
            if (section.required && !content) {
                errors.push(`${section.label} is required`);
            }

            return { valid: errors.length === 0, errors };
        }
    };
}

// Export for use in collaboration system
module.exports = {
    technicalBlocks,
    narrativeStructures,
    getEditorialStructure
};
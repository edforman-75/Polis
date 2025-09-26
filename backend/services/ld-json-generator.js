/**
 * LD-JSON (Linked Data - JSON) Generator for Campaign Website Content
 *
 * Generates structured data markup for campaign web content to improve SEO,
 * search engine understanding, and social media sharing
 *
 * Includes both official schema.org types AND custom Democratic campaign schemas
 */

const PoliticalCampaignSchemas = require('../data/political-campaign-schemas');

class LDJsonGenerator {
    constructor() {
        // Enhanced contexts - schema.org + political campaign extensions
        this.contexts = PoliticalCampaignSchemas.CAMPAIGN_CONTEXT;

        // Assignment schema mappings (expanded significantly)
        this.assignmentSchemas = PoliticalCampaignSchemas.ASSIGNMENT_SCHEMA_MAPPING;

        // Extended political campaign schema types
        this.extendedSchemas = PoliticalCampaignSchemas.EXTENDED_SCHEMA_TYPES;

        // Campaign values and policy context
        this.campaignValues = PoliticalCampaignSchemas.CAMPAIGN_VALUES;

        // Enhanced properties for existing types
        this.enhancedProperties = PoliticalCampaignSchemas.ENHANCED_PROPERTIES;

        // Expanded assignment types that require LD-JSON for web publication
        this.webAssignmentTypes = [
            // Traditional web content
            'press_release',
            'statement',
            'op_ed',
            'policy_announcement',
            'endorsement',
            'event_announcement',
            'blog_post',
            'news_article',
            'biography',
            'issue_position',

            // Democratic campaign specific
            'fundraising_appeal',
            'volunteer_recruitment',
            'voter_outreach',
            'coalition_building',
            'town_hall',
            'issue_advocacy',
            'candidate_introduction',
            'debate_preparation',
            'get_out_vote',
            'community_organizing',

            // Progressive issue-focused
            'social_justice_statement',
            'environmental_policy',
            'healthcare_proposal',
            'economic_justice',
            'civil_rights_statement',
            'immigration_policy'
        ];
    }

    /**
     * Main function to generate LD-JSON for campaign content
     * Now supports multiple schema types and Democratic campaign extensions
     */
    generateLDJson(assignmentData, contentData, candidateProfile) {
        const assignmentType = assignmentData.assignmentType;

        // Only generate LD-JSON for web content
        if (!this.webAssignmentTypes.includes(assignmentType)) {
            return null;
        }

        // Get schema mapping for this assignment type
        const schemaMapping = this.assignmentSchemas[assignmentType];
        let ldJsonData = {};

        if (schemaMapping) {
            // Generate enhanced LD-JSON with multiple schema types
            ldJsonData = this.generateEnhancedLDJson(assignmentData, contentData, candidateProfile, schemaMapping);
        } else {
            // Fallback to traditional single-schema approach
            ldJsonData = this.generateTraditionalLDJson(assignmentData, contentData, candidateProfile);
        }

        // Add Democratic campaign context and progressive values
        ldJsonData = this.addDemocraticCampaignContext(ldJsonData, candidateProfile, assignmentData);

        const schemaTypes = Array.isArray(ldJsonData['@type']) ? ldJsonData['@type'] : [ldJsonData['@type']];

        return {
            html_tag: `<script type="application/ld+json">${JSON.stringify(ldJsonData, null, 2)}</script>`,
            json_data: ldJsonData,
            validation_url: `https://search.google.com/test/rich-results?url=${encodeURIComponent(assignmentData.publishUrl || 'https://example.com')}`,
            schema_types: schemaTypes,
            primary_type: schemaMapping?.primary || ldJsonData['@type'],
            custom_extensions: this.getCustomExtensions(schemaTypes),
            seo_benefits: this.getEnhancedSEOBenefits(assignmentType, schemaTypes)
        };
    }

    /**
     * Generate enhanced LD-JSON with multiple schema types and Democratic extensions
     */
    generateEnhancedLDJson(assignmentData, contentData, candidateProfile, schemaMapping) {
        const baseData = {
            "@context": this.contexts,
            "@type": [schemaMapping.primary, ...schemaMapping.secondary],
            "headline": contentData.headline || assignmentData.title,
            "description": contentData.summary || contentData.excerpt,
            "datePublished": assignmentData.publishDate || new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "url": assignmentData.publishUrl
        };

        // Add author with Democratic campaign context
        baseData.author = {
            "@type": "Person",
            "name": candidateProfile.fullName,
            "jobTitle": `Candidate for ${candidateProfile.office}`,
            "url": candidateProfile.websiteUrl,
            "affiliation": {
                "@type": "PoliticalParty",
                "name": candidateProfile.party || "Democratic Party"
            }
        };

        // Add enhanced properties based on assignment type
        if (assignmentType === 'fundraising_appeal') {
            baseData["dem:grassrootsFundraising"] = true;
            baseData["dem:smallDollarGoal"] = assignmentData.fundraisingGoal;
            baseData["dem:transparencyCommitment"] = true;
        }

        if (assignmentType === 'volunteer_recruitment') {
            baseData["dem:communityOrganizing"] = true;
            baseData["dem:volunteerOpportunities"] = contentData.opportunities || [];
        }

        if (assignmentType === 'voter_outreach') {
            baseData["dem:voterRegistration"] = true;
            baseData["dem:targetDemographic"] = assignmentData.targetAudience;
        }

        // Add progressive context if applicable
        if (schemaMapping.progressive_context) {
            baseData["progressive:context"] = schemaMapping.progressive_context;
            baseData["progressive:values"] = this.getRelevantProgressiveValues(assignmentData);
        }

        return baseData;
    }

    /**
     * Fallback to traditional LD-JSON generation
     */
    generateTraditionalLDJson(assignmentData, contentData, candidateProfile) {
        const assignmentType = assignmentData.assignmentType;

        switch (assignmentType) {
            case 'press_release':
                return this.generatePressReleaseLDJson(assignmentData, contentData, candidateProfile);
            case 'statement':
                return this.generateStatementLDJson(assignmentData, contentData, candidateProfile);
            case 'op_ed':
            case 'blog_post':
            case 'news_article':
                return this.generateArticleLDJson(assignmentData, contentData, candidateProfile);
            case 'policy_announcement':
                return this.generatePolicyLDJson(assignmentData, contentData, candidateProfile);
            case 'endorsement':
                return this.generateEndorsementLDJson(assignmentData, contentData, candidateProfile);
            case 'event_announcement':
                return this.generateEventLDJson(assignmentData, contentData, candidateProfile);
            case 'biography':
                return this.generateBiographyLDJson(assignmentData, contentData, candidateProfile);
            case 'issue_position':
                return this.generateIssuePositionLDJson(assignmentData, contentData, candidateProfile);
            default:
                return this.generateGenericArticleLDJson(assignmentData, contentData, candidateProfile);
        }
    }

    /**
     * Get relevant progressive values based on assignment content
     */
    getRelevantProgressiveValues(assignmentData) {
        const values = [];
        const topics = assignmentData.topics || [];
        const issueArea = assignmentData.issueArea || '';

        if (topics.includes('healthcare') || issueArea.includes('healthcare')) {
            values.push('Healthcare as Human Right');
        }
        if (topics.includes('environment') || issueArea.includes('climate')) {
            values.push('Environmental Justice');
        }
        if (topics.includes('economy') || issueArea.includes('economy')) {
            values.push('Economic Justice');
        }
        if (topics.includes('civil rights') || issueArea.includes('civil rights')) {
            values.push('Social Justice');
        }

        return values;
    }

    /**
     * Get custom schema extensions being used
     */
    getCustomExtensions(schemaTypes) {
        const extensions = [];

        schemaTypes.forEach(type => {
            if (type.startsWith('dem:')) {
                extensions.push(`Democratic Campaign: ${type}`);
            }
            if (type.startsWith('progressive:')) {
                extensions.push(`Progressive Politics: ${type}`);
            }
        });

        return extensions;
    }

    /**
     * Generate LD-JSON for press releases
     */
    generatePressReleaseLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": "NewsArticle",
            "headline": contentData.headline || assignmentData.title,
            "description": contentData.summary || contentData.excerpt,
            "articleBody": contentData.body,
            "datePublished": assignmentData.publishDate || new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
                "@type": "Person",
                "name": candidateProfile.fullName,
                "url": candidateProfile.websiteUrl,
                "sameAs": candidateProfile.socialMediaUrls || []
            },
            "publisher": {
                "@type": "Organization",
                "name": `${candidateProfile.firstName} ${candidateProfile.lastName} for ${candidateProfile.office}`,
                "url": candidateProfile.websiteUrl,
                "logo": {
                    "@type": "ImageObject",
                    "url": candidateProfile.logoUrl,
                    "width": 600,
                    "height": 60
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": assignmentData.publishUrl
            },
            "image": contentData.featuredImage ? {
                "@type": "ImageObject",
                "url": contentData.featuredImage.url,
                "width": contentData.featuredImage.width || 1200,
                "height": contentData.featuredImage.height || 630
            } : null,
            "keywords": contentData.tags || assignmentData.topics,
            "about": assignmentData.topics?.map(topic => ({
                "@type": "Thing",
                "name": topic
            })),
            "isPartOf": {
                "@type": "Website",
                "name": `${candidateProfile.firstName} ${candidateProfile.lastName} Campaign`,
                "url": candidateProfile.websiteUrl
            }
        };
    }

    /**
     * Generate LD-JSON for candidate statements
     */
    generateStatementLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": "Article",
            "headline": contentData.headline || assignmentData.title,
            "description": contentData.summary,
            "articleBody": contentData.body,
            "datePublished": assignmentData.publishDate || new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
                "@type": "Person",
                "name": candidateProfile.fullName,
                "jobTitle": `Candidate for ${candidateProfile.office}`,
                "url": candidateProfile.websiteUrl,
                "sameAs": candidateProfile.socialMediaUrls || [],
                "affiliation": {
                    "@type": "PoliticalParty",
                    "name": candidateProfile.party
                }
            },
            "publisher": {
                "@type": "Organization",
                "name": `${candidateProfile.firstName} ${candidateProfile.lastName} Campaign`,
                "url": candidateProfile.websiteUrl
            },
            "mainEntityOfPage": assignmentData.publishUrl,
            "about": {
                "@type": "Thing",
                "name": assignmentData.subject || assignmentData.title
            },
            "mentions": this.extractMentions(contentData.body),
            "keywords": contentData.tags || assignmentData.topics
        };
    }

    /**
     * Generate LD-JSON for articles, op-eds, blog posts
     */
    generateArticleLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": "Article",
            "headline": contentData.headline,
            "alternativeHeadline": contentData.subheadline,
            "description": contentData.summary,
            "articleBody": contentData.body,
            "datePublished": assignmentData.publishDate || new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
                "@type": "Person",
                "name": candidateProfile.fullName,
                "jobTitle": `Candidate for ${candidateProfile.office}`,
                "url": candidateProfile.websiteUrl,
                "image": candidateProfile.photoUrl
            },
            "publisher": {
                "@type": "Organization",
                "name": `${candidateProfile.firstName} ${candidateProfile.lastName} Campaign`,
                "url": candidateProfile.websiteUrl,
                "logo": {
                    "@type": "ImageObject",
                    "url": candidateProfile.logoUrl
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": assignmentData.publishUrl
            },
            "image": contentData.featuredImage ? {
                "@type": "ImageObject",
                "url": contentData.featuredImage.url,
                "width": contentData.featuredImage.width || 1200,
                "height": contentData.featuredImage.height || 630,
                "caption": contentData.featuredImage.caption
            } : null,
            "articleSection": assignmentData.category || "Politics",
            "wordCount": contentData.wordCount,
            "keywords": contentData.tags,
            "about": assignmentData.topics?.map(topic => ({
                "@type": "Thing",
                "name": topic
            }))
        };
    }

    /**
     * Generate LD-JSON for policy announcements
     */
    generatePolicyLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": ["Article", "GovernmentService"],
            "headline": contentData.headline,
            "description": contentData.summary,
            "articleBody": contentData.body,
            "datePublished": assignmentData.publishDate || new Date().toISOString(),
            "author": {
                "@type": "Person",
                "name": candidateProfile.fullName,
                "jobTitle": `Candidate for ${candidateProfile.office}`
            },
            "about": {
                "@type": "GovernmentService",
                "name": assignmentData.policyArea,
                "description": contentData.summary,
                "serviceType": "Policy Proposal",
                "provider": {
                    "@type": "Person",
                    "name": candidateProfile.fullName
                }
            },
            "mainEntity": {
                "@type": "Thing",
                "name": assignmentData.policyTitle || contentData.headline,
                "description": contentData.summary
            },
            "keywords": contentData.tags,
            "isPartOf": {
                "@type": "PoliticalParty",
                "name": candidateProfile.party
            }
        };
    }

    /**
     * Generate LD-JSON for endorsements
     */
    generateEndorsementLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": "EndorseAction",
            "agent": {
                "@type": assignmentData.endorser?.type === 'organization' ? "Organization" : "Person",
                "name": assignmentData.endorser?.name,
                "url": assignmentData.endorser?.url
            },
            "object": {
                "@type": "Person",
                "name": candidateProfile.fullName,
                "jobTitle": `Candidate for ${candidateProfile.office}`,
                "url": candidateProfile.websiteUrl,
                "affiliation": {
                    "@type": "PoliticalParty",
                    "name": candidateProfile.party
                }
            },
            "result": {
                "@type": "Article",
                "headline": contentData.headline,
                "description": contentData.summary,
                "datePublished": assignmentData.publishDate || new Date().toISOString(),
                "author": {
                    "@type": "Person",
                    "name": assignmentData.endorser?.name
                }
            },
            "startTime": assignmentData.endorsementDate || assignmentData.publishDate
        };
    }

    /**
     * Generate LD-JSON for events
     */
    generateEventLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": "Event",
            "name": contentData.headline || assignmentData.eventTitle,
            "description": contentData.summary,
            "startDate": assignmentData.eventDate?.start,
            "endDate": assignmentData.eventDate?.end,
            "location": {
                "@type": "Place",
                "name": assignmentData.venue?.name,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": assignmentData.venue?.address?.street,
                    "addressLocality": assignmentData.venue?.address?.city,
                    "addressRegion": assignmentData.venue?.address?.state,
                    "postalCode": assignmentData.venue?.address?.zip
                }
            },
            "organizer": {
                "@type": "Person",
                "name": candidateProfile.fullName,
                "url": candidateProfile.websiteUrl
            },
            "performer": {
                "@type": "Person",
                "name": candidateProfile.fullName
            },
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": assignmentData.attendanceMode || "https://schema.org/OfflineEventAttendanceMode",
            "offers": assignmentData.ticketInfo ? {
                "@type": "Offer",
                "price": assignmentData.ticketInfo.price || "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": assignmentData.ticketInfo.url
            } : null,
            "image": contentData.featuredImage?.url,
            "url": assignmentData.publishUrl
        };
    }

    /**
     * Generate LD-JSON for candidate biography
     */
    generateBiographyLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": "Person",
            "name": candidateProfile.fullName,
            "givenName": candidateProfile.firstName,
            "familyName": candidateProfile.lastName,
            "jobTitle": `Candidate for ${candidateProfile.office}`,
            "description": contentData.summary,
            "url": candidateProfile.websiteUrl,
            "image": candidateProfile.photoUrl,
            "sameAs": candidateProfile.socialMediaUrls || [],
            "affiliation": [
                {
                    "@type": "PoliticalParty",
                    "name": candidateProfile.party
                },
                {
                    "@type": "Organization",
                    "name": `${candidateProfile.firstName} ${candidateProfile.lastName} Campaign`
                }
            ],
            "alumniOf": candidateProfile.education?.map(edu => ({
                "@type": "EducationalOrganization",
                "name": edu.institution,
                "degree": edu.degree
            })),
            "worksFor": candidateProfile.experience?.map(exp => ({
                "@type": "Organization",
                "name": exp.organization,
                "jobTitle": exp.position
            })),
            "address": {
                "@type": "PostalAddress",
                "addressLocality": candidateProfile.location?.city,
                "addressRegion": candidateProfile.location?.state
            },
            "knowsAbout": assignmentData.expertiseAreas || candidateProfile.issues,
            "seeks": {
                "@type": "Role",
                "roleName": candidateProfile.office,
                "startDate": candidateProfile.electionDate
            }
        };
    }

    /**
     * Generate LD-JSON for issue positions
     */
    generateIssuePositionLDJson(assignmentData, contentData, candidateProfile) {
        return {
            "@context": this.contexts.base,
            "@type": "Article",
            "headline": contentData.headline,
            "description": contentData.summary,
            "articleBody": contentData.body,
            "datePublished": assignmentData.publishDate || new Date().toISOString(),
            "author": {
                "@type": "Person",
                "name": candidateProfile.fullName,
                "jobTitle": `Candidate for ${candidateProfile.office}`
            },
            "about": {
                "@type": "Thing",
                "name": assignmentData.issueArea,
                "description": `${candidateProfile.fullName}'s position on ${assignmentData.issueArea}`
            },
            "mainEntity": {
                "@type": "ClaimReview",
                "claimReviewed": contentData.position,
                "author": {
                    "@type": "Person",
                    "name": candidateProfile.fullName
                },
                "datePublished": assignmentData.publishDate || new Date().toISOString(),
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "Support",
                    "author": {
                        "@type": "Person",
                        "name": candidateProfile.fullName
                    }
                }
            },
            "keywords": [assignmentData.issueArea, ...contentData.tags]
        };
    }

    /**
     * Add campaign-specific context to any LD-JSON
     */
    addCampaignContext(ldJsonData, candidateProfile) {
        // Add campaign-specific properties
        if (!ldJsonData.mentions) {
            ldJsonData.mentions = [];
        }

        // Add election context
        ldJsonData.mentions.push({
            "@type": "Event",
            "name": `${candidateProfile.electionYear} ${candidateProfile.office} Election`,
            "startDate": candidateProfile.electionDate,
            "location": {
                "@type": "Place",
                "name": candidateProfile.jurisdiction
            }
        });

        // Add political party context
        if (!ldJsonData.isPartOf && candidateProfile.party) {
            ldJsonData.isPartOf = {
                "@type": "PoliticalParty",
                "name": candidateProfile.party
            };
        }

        return ldJsonData;
    }

    /**
     * Extract mentions from content body
     */
    extractMentions(contentBody) {
        if (!contentBody) return [];

        const mentions = [];

        // Extract organization mentions (simple pattern matching)
        const orgPatterns = [
            /\b(?:Department|Agency|Bureau|Commission|Committee|Board|Office|Administration)\s+(?:of|for)\s+[\w\s]+/gi,
            /\b(?:U\.S\.|United States)\s+[\w\s]+/gi
        ];

        orgPatterns.forEach(pattern => {
            const matches = contentBody.match(pattern) || [];
            matches.forEach(match => {
                mentions.push({
                    "@type": "Organization",
                    "name": match.trim()
                });
            });
        });

        // Extract person mentions (titles + names)
        const personPattern = /\b(?:Senator|Representative|Governor|Mayor|President|Vice President|Attorney General)\s+[\w\s\.]+/gi;
        const personMatches = contentBody.match(personPattern) || [];

        personMatches.forEach(match => {
            mentions.push({
                "@type": "Person",
                "name": match.trim()
            });
        });

        return mentions.slice(0, 10); // Limit to first 10 mentions
    }

    /**
     * Get SEO benefits explanation for each content type
     */
    getSEOBenefits(assignmentType) {
        const benefits = {
            press_release: [
                "Enhanced visibility in Google News",
                "Rich snippets with publication date and author",
                "Better social media sharing previews",
                "Improved crawling by news aggregators"
            ],
            statement: [
                "Clearer attribution to candidate",
                "Enhanced search result appearance",
                "Better topic association",
                "Improved content categorization"
            ],
            op_ed: [
                "Article rich snippets",
                "Author authority signals",
                "Enhanced sharing on social platforms",
                "Better content discovery"
            ],
            event_announcement: [
                "Event rich snippets with date/location",
                "Google Calendar integration potential",
                "Local search enhancement",
                "Map integration possibilities"
            ],
            biography: [
                "Knowledge panel eligibility",
                "Person entity recognition",
                "Enhanced candidate searches",
                "Cross-platform profile linking"
            ]
        };

        return benefits[assignmentType] || [
            "Enhanced search engine understanding",
            "Improved content categorization",
            "Better social media previews"
        ];
    }

    /**
     * Validate LD-JSON structure
     */
    validateLDJson(ldJsonData) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            recommendations: []
        };

        // Check required properties
        if (!ldJsonData['@context']) {
            validation.errors.push('Missing @context property');
            validation.isValid = false;
        }

        if (!ldJsonData['@type']) {
            validation.errors.push('Missing @type property');
            validation.isValid = false;
        }

        // Type-specific validations
        if (ldJsonData['@type'] === 'Article') {
            if (!ldJsonData.headline) {
                validation.warnings.push('Article should have headline property');
            }
            if (!ldJsonData.author) {
                validation.warnings.push('Article should have author property');
            }
            if (!ldJsonData.datePublished) {
                validation.warnings.push('Article should have datePublished property');
            }
        }

        if (ldJsonData['@type'] === 'Event') {
            if (!ldJsonData.startDate) {
                validation.errors.push('Event must have startDate property');
                validation.isValid = false;
            }
            if (!ldJsonData.location) {
                validation.warnings.push('Event should have location property');
            }
        }

        // General recommendations
        if (!ldJsonData.description) {
            validation.recommendations.push('Add description for better search results');
        }

        if (!ldJsonData.image) {
            validation.recommendations.push('Add image for richer social media sharing');
        }

        return validation;
    }
}

module.exports = new LDJsonGenerator();
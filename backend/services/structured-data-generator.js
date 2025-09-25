/**
 * Structured Data (LD-JSON) Generator
 * Generates Schema.org compliant JSON-LD for all political content types
 */

class StructuredDataGenerator {
    constructor() {
        this.baseContext = {
            "@context": "https://schema.org",
            "additionalType": "https://campaign.example.org/schema"
        };

        this.campaignInfo = {
            "@type": "PoliticalCampaign",
            "name": "[CAMPAIGN_NAME]",
            "candidate": {
                "@type": "Person",
                "name": "[CANDIDATE_NAME]",
                "jobTitle": "[OFFICE_SEEKING]",
                "politicalAffiliation": "[PARTY]"
            },
            "url": "[CAMPAIGN_WEBSITE]"
        };
    }

    // Generate LD-JSON for speeches
    generateSpeechData(speech, assignment = null) {
        const speechData = {
            ...this.baseContext,
            "@type": "SpeechEvent",
            "name": speech.title,
            "description": this.extractDescription(speech.content),
            "text": speech.content,
            "performer": this.campaignInfo.candidate,
            "about": assignment?.brief || "Political speech",
            "datePublished": speech.created_at,
            "dateModified": speech.updated_at,
            "inLanguage": "en-US",
            "isPartOf": this.campaignInfo,
            "keywords": this.extractKeywords(speech.content, 'political,speech,campaign'),
            "audience": {
                "@type": "Audience",
                "audienceType": "voters"
            }
        };

        // Add metadata if available
        if (speech.metadata) {
            const meta = typeof speech.metadata === 'string' ? JSON.parse(speech.metadata) : speech.metadata;
            if (meta.duration) speechData.duration = `PT${meta.duration}M`;
            if (meta.location) speechData.location = {
                "@type": "Place",
                "name": meta.location
            };
            if (meta.date) speechData.dateGiven = meta.date;
        }

        return speechData;
    }

    // Generate LD-JSON for press releases
    generatePressReleaseData(pressRelease, assignment = null) {
        return {
            ...this.baseContext,
            "@type": "NewsArticle",
            "headline": pressRelease.headline,
            "description": pressRelease.subheadline || this.extractDescription(pressRelease.content),
            "articleBody": pressRelease.content,
            "author": this.campaignInfo.candidate,
            "publisher": this.campaignInfo,
            "datePublished": pressRelease.created_at,
            "dateModified": pressRelease.updated_at,
            "inLanguage": "en-US",
            "about": assignment?.brief || "Political press release",
            "keywords": this.extractKeywords(pressRelease.content, 'politics,press-release,news'),
            "genre": "press release",
            "isPartOf": this.campaignInfo,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `[BASE_URL]/press-releases/${pressRelease.id}`
            }
        };
    }

    // Generate LD-JSON for social media posts
    generateSocialMediaData(socialPost, assignment = null) {
        const baseData = {
            ...this.baseContext,
            "@type": "SocialMediaPosting",
            "headline": this.extractHeadline(socialPost.content),
            "text": socialPost.content,
            "author": this.campaignInfo.candidate,
            "publisher": this.campaignInfo,
            "datePublished": socialPost.created_at,
            "dateModified": socialPost.updated_at,
            "inLanguage": "en-US",
            "about": assignment?.brief || "Political social media content",
            "keywords": this.extractKeywords(socialPost.content, `politics,social-media,${socialPost.platform}`),
            "isPartOf": this.campaignInfo,
            "sharedContent": {
                "@type": "CreativeWork",
                "text": socialPost.content,
                "platform": socialPost.platform
            }
        };

        // Platform-specific enhancements
        switch(socialPost.platform?.toLowerCase()) {
            case 'twitter':
            case 'x':
                baseData.additionalType = "https://schema.org/Tweet";
                break;
            case 'facebook':
                baseData.additionalType = "https://schema.org/FacebookPost";
                break;
            case 'instagram':
                baseData.additionalType = "https://schema.org/InstagramPost";
                break;
            case 'linkedin':
                baseData.additionalType = "https://schema.org/LinkedInPost";
                break;
        }

        // Add hashtags
        if (socialPost.hashtags) {
            const hashtags = typeof socialPost.hashtags === 'string'
                ? socialPost.hashtags.split(',').map(h => h.trim())
                : socialPost.hashtags;
            baseData.keywords = baseData.keywords + ',' + hashtags.join(',');
        }

        // Add media URLs
        if (socialPost.media_urls) {
            const mediaUrls = typeof socialPost.media_urls === 'string'
                ? JSON.parse(socialPost.media_urls)
                : socialPost.media_urls;
            baseData.associatedMedia = mediaUrls.map(url => ({
                "@type": "MediaObject",
                "contentUrl": url,
                "encodingFormat": this.getMediaType(url)
            }));
        }

        return baseData;
    }

    // Generate LD-JSON for talking points
    generateTalkingPointsData(content, assignment = null) {
        const questions = this.extractQuestionsAndAnswers(content);

        return {
            ...this.baseContext,
            "@type": "FAQPage",
            "name": assignment?.title || "Campaign Talking Points",
            "description": assignment?.brief || "Key messaging and talking points",
            "author": this.campaignInfo.candidate,
            "publisher": this.campaignInfo,
            "datePublished": new Date().toISOString(),
            "inLanguage": "en-US",
            "about": "Political messaging and communication",
            "keywords": this.extractKeywords(content, 'politics,talking-points,messaging'),
            "isPartOf": this.campaignInfo,
            "mainEntity": questions.map(qa => ({
                "@type": "Question",
                "name": qa.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": qa.answer,
                    "author": this.campaignInfo.candidate
                }
            }))
        };
    }

    // Generate LD-JSON for policy documents
    generatePolicyData(policy, assignment = null) {
        return {
            ...this.baseContext,
            "@type": "GovernmentService",
            "name": policy.title,
            "description": policy.summary || this.extractDescription(policy.content),
            "text": policy.content,
            "provider": this.campaignInfo,
            "author": this.campaignInfo.candidate,
            "datePublished": policy.created_at,
            "dateModified": policy.updated_at,
            "inLanguage": "en-US",
            "about": assignment?.brief || "Policy position document",
            "keywords": this.extractKeywords(policy.content, `politics,policy,${policy.type}`),
            "isPartOf": this.campaignInfo,
            "category": policy.type,
            "additionalType": "PolicyDocument"
        };
    }

    // Generate LD-JSON for blog posts
    generateBlogPostData(content, assignment = null) {
        return {
            ...this.baseContext,
            "@type": "BlogPosting",
            "headline": assignment?.title || this.extractHeadline(content),
            "description": assignment?.description || this.extractDescription(content),
            "articleBody": content,
            "author": this.campaignInfo.candidate,
            "publisher": this.campaignInfo,
            "datePublished": new Date().toISOString(),
            "inLanguage": "en-US",
            "about": assignment?.brief || "Political blog post",
            "keywords": this.extractKeywords(content, 'politics,blog,opinion'),
            "isPartOf": this.campaignInfo,
            "genre": "political blog post"
        };
    }

    // Generate LD-JSON for newsletters
    generateNewsletterData(content, assignment = null) {
        return {
            ...this.baseContext,
            "@type": "NewsArticle",
            "headline": assignment?.title || "Campaign Newsletter",
            "description": assignment?.description || "Campaign update and news",
            "articleBody": content,
            "author": this.campaignInfo.candidate,
            "publisher": this.campaignInfo,
            "datePublished": new Date().toISOString(),
            "inLanguage": "en-US",
            "about": assignment?.brief || "Campaign newsletter",
            "keywords": this.extractKeywords(content, 'politics,newsletter,campaign-update'),
            "isPartOf": this.campaignInfo,
            "genre": "newsletter",
            "additionalType": "CampaignNewsletter"
        };
    }

    // Utility methods
    extractDescription(content, maxLength = 160) {
        if (!content) return '';
        const cleaned = content.replace(/[#*\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
        return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
    }

    extractHeadline(content) {
        if (!content) return '';
        const lines = content.split('\n').filter(line => line.trim());
        return lines[0]?.replace(/[#*]/g, '').trim() || 'Political Content';
    }

    extractKeywords(content, baseKeywords = '') {
        const commonPoliticalTerms = [
            'democracy', 'election', 'vote', 'policy', 'government', 'community',
            'leadership', 'change', 'future', 'economy', 'healthcare', 'education',
            'security', 'environment', 'jobs', 'reform', 'progress'
        ];

        const found = commonPoliticalTerms.filter(term =>
            content.toLowerCase().includes(term.toLowerCase())
        );

        return baseKeywords + (found.length > 0 ? ',' + found.slice(0, 8).join(',') : '');
    }

    extractQuestionsAndAnswers(content) {
        const questions = [];
        const lines = content.split('\n');
        let currentQ = null;

        for (const line of lines) {
            if (line.trim().startsWith('Q:')) {
                if (currentQ) questions.push(currentQ);
                currentQ = { question: line.replace('Q:', '').trim(), answer: '' };
            } else if (line.trim().startsWith('A:') && currentQ) {
                currentQ.answer = line.replace('A:', '').trim();
            }
        }

        if (currentQ) questions.push(currentQ);
        return questions.length > 0 ? questions : [
            { question: "What is this content about?", answer: "Campaign messaging and key points." }
        ];
    }

    getMediaType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoTypes = ['mp4', 'mov', 'avi', 'webm'];

        if (imageTypes.includes(extension)) return 'image/' + (extension === 'jpg' ? 'jpeg' : extension);
        if (videoTypes.includes(extension)) return 'video/' + extension;
        return 'application/octet-stream';
    }

    // Main generation method - routes to appropriate generator
    generateStructuredData(contentType, data, assignment = null) {
        switch (contentType) {
            case 'speech':
                return this.generateSpeechData(data, assignment);
            case 'press-release':
                return this.generatePressReleaseData(data, assignment);
            case 'social-media':
                return this.generateSocialMediaData(data, assignment);
            case 'talking-points':
                return this.generateTalkingPointsData(data.content || data, assignment);
            case 'policy-document':
                return this.generatePolicyData(data, assignment);
            case 'blog-post':
                return this.generateBlogPostData(data.content || data, assignment);
            case 'newsletter':
                return this.generateNewsletterData(data.content || data, assignment);
            default:
                return this.generateGenericData(data, assignment);
        }
    }

    generateGenericData(data, assignment = null) {
        return {
            ...this.baseContext,
            "@type": "CreativeWork",
            "name": assignment?.title || data.title || "Political Content",
            "description": assignment?.description || this.extractDescription(data.content || data),
            "text": data.content || data,
            "author": this.campaignInfo.candidate,
            "publisher": this.campaignInfo,
            "datePublished": data.created_at || new Date().toISOString(),
            "inLanguage": "en-US",
            "about": assignment?.brief || "Political content",
            "keywords": this.extractKeywords(data.content || data, 'politics,campaign'),
            "isPartOf": this.campaignInfo
        };
    }
}

module.exports = new StructuredDataGenerator();
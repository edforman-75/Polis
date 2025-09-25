/**
 * Social Media Content Processor
 * Handles processing of social media posts
 */

class SocialMediaProcessor {
    process(data, existing = null) {
        // Extract hashtags from content
        const hashtags = this.extractHashtags(data.content);

        // Optimize content for platform
        const optimizedContent = this.optimizeForPlatform(data.content, data.platform);

        return {
            ...data,
            content: optimizedContent,
            hashtags: hashtags.length > 0 ? hashtags : data.hashtags,
            wordCount: this.getWordCount(optimizedContent),
            characterCount: optimizedContent.length,
            processedAt: new Date().toISOString()
        };
    }

    extractHashtags(content) {
        const hashtags = content.match(/#\w+/g) || [];
        return hashtags.map(tag => tag.toLowerCase());
    }

    optimizeForPlatform(content, platform) {
        switch (platform.toLowerCase()) {
            case 'twitter':
                return content.length > 280 ? content.substring(0, 277) + '...' : content;
            case 'instagram':
                return content.length > 2200 ? content.substring(0, 2197) + '...' : content;
            case 'facebook':
                return content.length > 63206 ? content.substring(0, 63203) + '...' : content;
            default:
                return content;
        }
    }

    getWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

module.exports = new SocialMediaProcessor();
const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Mock photo database - in a real app this would be from a database
const photos = [
    {
        id: 1,
        title: "Healthcare Town Hall - Queens Community Center",
        url: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04",
        category: "events",
        tags: ["healthcare", "town-hall", "queens", "community", "speaking"],
        caption: "Mandami addressing healthcare concerns at packed town hall meeting",
        content_description: "politician speaking at podium to diverse audience about healthcare policy",
        emotional_tone: "serious, engaged, authoritative",
        setting: "indoor community center, formal presentation",
        people_count: "large crowd, 50+ people",
        demographics: "diverse, mixed ages, community members"
    },
    {
        id: 2,
        title: "Community Healthcare Discussion",
        url: "https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a",
        category: "events",
        tags: ["healthcare", "community", "discussion", "town-hall", "engagement"],
        caption: "Interactive healthcare policy discussion with Queens residents",
        content_description: "diverse group of people in community meeting discussing healthcare",
        emotional_tone: "collaborative, concerned, hopeful",
        setting: "community room, informal discussion setup",
        people_count: "medium group, 20-30 people",
        demographics: "diverse community members, families, seniors"
    },
    {
        id: 3,
        title: "Professional Campaign Portrait",
        url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
        category: "portraits",
        tags: ["professional", "headshot", "campaign", "formal"],
        caption: "Official campaign portrait for Mandami's NYC Council race",
        content_description: "professional headshot of confident politician in business attire",
        emotional_tone: "confident, approachable, professional",
        setting: "studio portrait, clean background",
        people_count: "single person",
        demographics: "professional politician"
    },
    {
        id: 4,
        title: "Small Business Visit - Jackson Heights",
        url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",
        category: "community",
        tags: ["business", "jackson-heights", "economy", "immigrants", "local"],
        caption: "Mandami meeting immigrant business owners in Jackson Heights",
        content_description: "politician visiting local business, talking with shop owners",
        emotional_tone: "warm, supportive, engaged",
        setting: "local business, street-level interaction",
        people_count: "small group, 3-5 people",
        demographics: "immigrant business owners, working class"
    },
    {
        id: 5,
        title: "Subway Infrastructure Tour - Roosevelt Ave",
        url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
        category: "policy",
        tags: ["subway", "infrastructure", "roosevelt", "transit", "MTA"],
        caption: "Mandami highlighting need for subway accessibility improvements",
        content_description: "politician in subway station discussing transit infrastructure",
        emotional_tone: "determined, analytical, concerned",
        setting: "subway station, urban infrastructure",
        people_count: "small group, 2-4 people",
        demographics: "transit advocates, commuters"
    },
    {
        id: 6,
        title: "Community Festival - Diversity Plaza",
        url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18",
        category: "community",
        tags: ["festival", "diversity", "families", "culture", "celebration"],
        caption: "Celebrating cultural diversity at annual Diversity Plaza festival",
        content_description: "joyful community celebration with families and cultural activities",
        emotional_tone: "joyful, celebratory, inclusive",
        setting: "outdoor festival, colorful community event",
        people_count: "large crowd, 100+ people",
        demographics: "diverse families, children, multi-generational"
    },
    {
        id: 7,
        title: "Campaign Team Planning Session",
        url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
        category: "portraits",
        tags: ["team", "staff", "campaign", "planning", "strategy", "diverse"],
        caption: "Mandami's diverse campaign team planning community outreach strategy",
        content_description: "diverse group of young professionals collaborating in meeting",
        emotional_tone: "focused, collaborative, energetic",
        setting: "office meeting room, modern workspace",
        people_count: "medium group, 6-8 people",
        demographics: "young professionals, diverse campaign staff"
    },
    {
        id: 8,
        title: "Housing Justice Rally - Court Square",
        url: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6",
        category: "policy",
        tags: ["housing", "justice", "rally", "affordability", "tenants"],
        caption: "Mandami speaking at housing affordability rally in Long Island City",
        content_description: "passionate speech at outdoor rally about housing rights",
        emotional_tone: "passionate, determined, inspiring",
        setting: "outdoor rally, urban plaza",
        people_count: "large crowd, 75+ people",
        demographics: "housing advocates, tenants, community organizers"
    },
    {
        id: 9,
        title: "School Visit - PS 122 Reading Program",
        url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
        category: "community",
        tags: ["education", "children", "school", "reading", "ps122"],
        caption: "Mandami reading with students during literacy week at PS 122",
        content_description: "politician reading to elementary school children in classroom",
        emotional_tone: "warm, nurturing, educational",
        setting: "elementary school classroom, educational environment",
        people_count: "small group, 8-12 children",
        demographics: "elementary school students, diverse children"
    },
    {
        id: 10,
        title: "Street Team Canvassing - Elmhurst",
        url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
        category: "portraits",
        tags: ["canvassing", "volunteers", "elmhurst", "grassroots", "doorknocking"],
        caption: "Campaign volunteers canvassing in Elmhurst neighborhood",
        content_description: "young volunteers with clipboards doing door-to-door outreach",
        emotional_tone: "enthusiastic, grassroots, committed",
        setting: "residential neighborhood, door-to-door activity",
        people_count: "small group, 3-4 people",
        demographics: "young volunteers, diverse campaign workers"
    }
];

// AI-powered photo search endpoint
router.post('/search', async (req, res) => {
    try {
        const { query, context = {} } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Use AI to understand the search intent and match photos
        const searchPrompt = `
You are an AI photo curator for a political campaign. A user is searching for photos with this query: "${query}"

Additional context:
- Campaign: ${context.campaign || 'NYC Council race'}
- Content type: ${context.contentType || 'general campaign content'}
- Platform: ${context.platform || 'multi-platform'}
- Tone needed: ${context.tone || 'professional'}

Here are the available photos in our library:
${photos.map(photo => `
ID: ${photo.id}
Title: ${photo.title}
Category: ${photo.category}
Tags: ${photo.tags.join(', ')}
Description: ${photo.content_description}
Tone: ${photo.emotional_tone}
Setting: ${photo.setting}
Demographics: ${photo.demographics}
`).join('\n')}

Based on the search query and context, please:
1. Rank photos by relevance (1-10 scale)
2. Explain why each photo matches or doesn't match
3. Consider semantic meaning, not just keyword matching

Return a JSON array of photo IDs ranked by relevance, with scores and explanations:
[
  {
    "id": 1,
    "relevance_score": 9,
    "explanation": "Perfect match because..."
  }
]

Only include photos with relevance_score >= 6.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: searchPrompt }],
            temperature: 0.3
        });

        let aiResults;
        try {
            aiResults = JSON.parse(completion.choices[0].message.content);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fallback to basic keyword search
            aiResults = basicKeywordSearch(query);
        }

        // Get the actual photo objects with AI rankings
        const rankedPhotos = aiResults.map(result => {
            const photo = photos.find(p => p.id === result.id);
            return {
                ...photo,
                relevance_score: result.relevance_score,
                ai_explanation: result.explanation
            };
        });

        res.json({
            query,
            results: rankedPhotos,
            total: rankedPhotos.length
        });

    } catch (error) {
        console.error('Photo search error:', error);

        // Fallback to basic search if AI fails
        const fallbackResults = basicKeywordSearch(req.body.query);
        const fallbackPhotos = fallbackResults.map(result => {
            const photo = photos.find(p => p.id === result.id);
            return {
                ...photo,
                relevance_score: result.relevance_score,
                ai_explanation: "Basic keyword match (AI unavailable)"
            };
        });

        res.json({
            query: req.body.query,
            results: fallbackPhotos,
            total: fallbackPhotos.length,
            fallback: true
        });
    }
});

// Basic keyword search fallback
function basicKeywordSearch(query) {
    const queryTerms = query.toLowerCase().split(' ');

    return photos.map(photo => {
        let score = 0;
        const searchText = `${photo.title} ${photo.tags.join(' ')} ${photo.content_description}`.toLowerCase();

        queryTerms.forEach(term => {
            if (searchText.includes(term)) {
                score += 1;
            }
        });

        return {
            id: photo.id,
            relevance_score: Math.min(score * 2, 10), // Scale to 1-10
            explanation: `Basic keyword match for: ${queryTerms.join(', ')}`
        };
    }).filter(result => result.relevance_score >= 2)
      .sort((a, b) => b.relevance_score - a.relevance_score);
}

// Get photo suggestions based on content type
router.post('/suggestions', async (req, res) => {
    try {
        const { contentType, platform, tone, topic } = req.body;

        const suggestionPrompt = `
You are helping select photos for ${contentType} content about "${topic}" for ${platform}.
The desired tone is: ${tone}

Available photos: ${photos.map(p => `ID: ${p.id}, Title: ${p.title}, Tone: ${p.emotional_tone}, Category: ${p.category}`).join('\n')}

Suggest the top 5 most appropriate photos. Return JSON array with photo IDs and brief explanations:
[{"id": 1, "reason": "Perfect tone and subject match"}]
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: suggestionPrompt }],
            temperature: 0.4
        });

        const suggestions = JSON.parse(completion.choices[0].message.content);
        const suggestedPhotos = suggestions.map(s => ({
            ...photos.find(p => p.id === s.id),
            suggestion_reason: s.reason
        }));

        res.json({ suggestions: suggestedPhotos });

    } catch (error) {
        console.error('Photo suggestions error:', error);
        res.status(500).json({ error: 'Failed to generate photo suggestions' });
    }
});

// Get all photos (for compatibility)
router.get('/', (req, res) => {
    res.json({ photos });
});

module.exports = router;
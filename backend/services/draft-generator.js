const OpenAI = require('openai');

class DraftGenerator {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    // Generate initial draft from assignment brief
    async generateDraft(assignmentData, contentType = 'press-release') {
        try {
            const templatePrompt = this.getTemplatePrompt(contentType, assignmentData);

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional campaign communications writer. Generate structured, well-organized drafts that writers can easily edit and enhance. Focus on creating a solid foundation with proper structure, key points, and placeholders where specific details should be added."
                    },
                    { role: "user", content: templatePrompt }
                ],
                temperature: 0.4,
                max_tokens: 2000
            });

            const draftContent = completion.choices[0].message.content;
            return this.structureDraft(draftContent, contentType);

        } catch (error) {
            console.error('Draft Generation Error:', error);
            // Return fallback structured draft
            return this.getFallbackDraft(assignmentData, contentType);
        }
    }

    // Generate content-type specific prompts
    getTemplatePrompt(contentType, assignment) {
        const baseInfo = `
Assignment: ${assignment.title}
Type: ${assignment.type}
Deadline: ${assignment.deadline}
Priority: ${assignment.priority}
Target Audience: ${assignment.targetAudience}
Key Messages: ${assignment.keyMessages?.join(', ') || 'Not specified'}
Brief: ${assignment.brief}
Platform: ${assignment.platform || 'General'}
Candidate Voice: ${assignment.candidateProfile?.style || 'Professional yet approachable, authentic'}
`;

        const templates = {
            'press-release': `Create a professional campaign press release following AP style and industry standards:

${baseInfo}

Generate a complete press release with professional structure:

**HEADER ELEMENTS:**
- FOR IMMEDIATE RELEASE (or EMBARGOED UNTIL [TIME])
- Compelling, newsworthy headline (under 10 words)
- Subhead providing additional context (optional but recommended)
- Dateline: [CITY, State] – [Date]

**CONTENT STRUCTURE:**
1. **Lead Paragraph** (Who, What, When, Where, Why in first 35 words)
   - Hook journalists immediately with the news value
   - Include candidate name and key announcement

2. **Quote Paragraph** (Direct candidate quote - 1-2 sentences)
   - [CANDIDATE QUOTE] - Make it personal, quotable, and on-message
   - Reflects candidate's voice and campaign themes

3. **Supporting Details** (2-3 paragraphs)
   - Context and background information
   - Statistics, data points, and evidence
   - Policy implications or community impact

4. **Secondary Quote** (Optional - stakeholder/community voice)
   - [STAKEHOLDER QUOTE] - Third-party validation
   - Local leader, affected citizen, or expert endorsement

5. **Background Paragraph**
   - Relevant context about the issue
   - Previous related initiatives or positions
   - Broader policy framework

6. **About [CANDIDATE/CAMPAIGN]** (Boilerplate)
   - Brief candidate bio and key qualifications
   - Campaign website and key platforms

7. **Contact Information**
   - Press Secretary/Communications Director
   - Phone and email for media inquiries
   - High-resolution photos available upon request

**STYLE REQUIREMENTS:**
- AP Style formatting throughout
- Active voice, present tense for announcements
- Third person perspective
- Professional, newsworthy tone
- Include relevant keywords for SEO
- 300-500 words optimal length
- Double-space between paragraphs
- Include ### for end-of-release marker

Make it immediately publishable by news outlets with minimal editing required.`,

            'press-advisory': `Create a professional press advisory (media alert) for upcoming news events:

${baseInfo}

Generate a complete press advisory following campaign communications standards:

**HEADER:**
MEDIA ADVISORY / PRESS ADVISORY
FOR IMMEDIATE RELEASE
Contact: [Communications Director]
Phone: [Number] | Email: [Email]

**HEADLINE:**
[CANDIDATE NAME] TO [ACTION VERB] [EVENT/ANNOUNCEMENT]
[Location and Time Details]

**WHO:** ${assignment.candidateProfile?.name || '[CANDIDATE NAME]'}
**WHAT:** ${assignment.title || '[EVENT/ANNOUNCEMENT DESCRIPTION]'}
**WHEN:** [Day, Date, Time]
**WHERE:** [Specific Address and Directions]
**WHY:** [News Value and Significance]

**EVENT DETAILS:**
${assignment.brief || '[Detailed description of the event, announcement, or availability]'}

**BACKGROUND:**
- [Context about why this event is newsworthy]
- [Relevant policy positions or campaign themes]
- [Community impact or significance]

**MEDIA LOGISTICS:**
- **Arrival Time:** [30 minutes before event]
- **Set-up Time:** [For cameras and equipment]
- **Interview Availability:** [Before/after event details]
- **Photo Opportunities:** [Specific shots available]
- **Live Stream:** [If available, include links]

**INTERVIEW OPPORTUNITIES:**
- [CANDIDATE NAME] will be available for interviews
- [Duration and format - individual, pool, etc.]
- [Topics candidate is prepared to discuss]
- [Any restrictions or time limits]

**ATTENDANCE:**
- Expected attendees: [Community leaders, stakeholders]
- [Special guests or endorsers who will speak]
- [Estimated crowd size or significance]

**DRIVING DIRECTIONS:**
[Detailed directions from major highways]
[Parking information and restrictions]
[Public transportation options]

**CREDENTIALS/RSVP:**
- RSVP required by [DATE/TIME]
- Email: [press contact]
- Phone: [number]
- Credentials needed for [security/access]

**WEATHER CONTINGENCY:**
[Backup plan for outdoor events]
[Alternative location or format]

**FOR MORE INFORMATION:**
Campaign Press Secretary: [Name]
Phone: [24-hour number]
Email: [direct email]
Campaign website: [URL]

Create a compelling case for why media should attend while providing all necessary logistical information for successful coverage.`,

            'blog-post': `Create a blog post draft with the following structure:

${baseInfo}

Generate a complete blog post with:
1. Engaging title that captures the main message
2. Opening paragraph that hooks the reader
3. 3-4 main body sections with subheadings
4. Personal anecdotes or examples (mark as [PERSONAL STORY])
5. Policy details or solutions
6. Community impact discussion
7. Strong conclusion with call to action

Use conversational but authoritative tone, include specific placeholders for local details, and structure for easy readability.`,

            'social-media': `Create comprehensive social media campaign with platform-specific deliverables:

${baseInfo}

Generate a complete social media package with:

**CORE MESSAGE FRAMEWORK:**
1. Primary message (adaptable across platforms)
2. Supporting points for expansion
3. Call-to-action variations
4. Hashtag strategy (#CampaignTag #LocalTag #IssueTag)

**PLATFORM-SPECIFIC DELIVERABLES:**

**Twitter/X Version:**
- Main post (280 characters max)
- Thread version (if needed for complex topics)
- Quote tweet ready version
- Hashtags: 2-3 maximum for engagement
- Media suggestion: [IMAGE/VIDEO TYPE]

**Facebook Post:**
- Longer format version (1-2 paragraphs)
- Community engagement hooks
- Link preview optimization
- Event/action integration
- Hashtags: 3-5 strategic tags

**Instagram Content:**
- Caption with storytelling approach
- Emoji integration for engagement
- Story version (shortened for swipe-up)
- Hashtags: 10-15 strategic mix
- Visual content suggestions

**LinkedIn Version:**
- Professional tone adaptation
- Industry/policy focus
- Thought leadership angle
- Professional hashtags
- Connection to broader implications

**TikTok/Video Content:**
- Hook for first 3 seconds
- Key message delivery
- Trending hashtag integration
- Visual/audio cues

Focus on consistent messaging while optimizing for each platform's unique audience, format, and engagement patterns. Include scheduling recommendations and cross-platform promotion strategy.`,

            'speech': `Create a speech draft with the following structure:

${baseInfo}

Generate a complete speech with:
1. Strong opening/hook
2. Personal connection to the topic
3. 3 main points with supporting details
4. Audience interaction moments (mark as [PAUSE FOR APPLAUSE])
5. Local references (mark as [LOCAL REFERENCE])
6. Call to action
7. Memorable closing

Use spoken language, include timing cues, and create natural flow for verbal delivery.`,

            'op-ed': `Create an opinion editorial draft:

${baseInfo}

Generate a complete op-ed with:
1. Compelling headline and subtitle
2. Strong thesis statement in opening
3. Current event tie-in or news hook
4. Personal credibility establishment
5. 3-4 supporting arguments with evidence
6. Counter-argument acknowledgment
7. Solutions-focused conclusion
8. Author bio placeholder

Use persuasive writing style, include fact placeholders, and structure for newspaper publication.`,

            'newsletter': `Create a newsletter draft:

${baseInfo}

Generate newsletter content with:
1. Catchy subject line
2. Personal greeting from candidate
3. Main story/announcement
4. 2-3 brief additional updates
5. Community spotlight section
6. Upcoming events list
7. Call to action (donate, volunteer, etc.)
8. Social media links section

Use friendly, personal tone while maintaining professionalism. Include placeholder sections for regular features.`,

            'talking-points': `Create comprehensive Daily Talking Points for surrogate coordination based on professional DNC/campaign formats:

${baseInfo}

Generate professional daily talking points with the exact structure used by major campaigns:

**SUBJECT LINE:** Key Messages for Today's [Media Appearances/Surrogate Coordination]

### **TOP MESSAGING PRIORITIES:**

**1. [PRIMARY ISSUE/TOPIC]**
- "[Opening attack line/key position in quotes ready for TV]"
- **Key stat to use:** "[Specific statistic with source] according to [credible source]"
- **Sound bite:** "[Punchy, quotable closer that fits in 10 seconds]"

**2. [SECONDARY ISSUE]**
- **Attack line:** "[Direct, punchy criticism of opponent]"
- **Pivot:** "[Transition to your candidate's position]"
- **Closer:** "[Strong emotional/moral conclusion]"

### **KEY LINES FOR SURROGATES:**
"[Exact phrase all surrogates should repeat]"

### **IF ASKED ABOUT [DEFENSIVE TOPIC]:**
"[Prepared defensive response that pivots to offense]"

### **SUPPORTING SOCIAL MEDIA CONTENT:**
- Links to amplifying tweets from key allies
- Pre-approved hashtags: #CampaignTag #LocalTag #IssueTag
- Shareable graphics and quotes available at [LINK]

### **COORDINATION ELEMENTS:**
- **Statistical backup** for each major claim
- **Emotional language** choices ("shameless," "corrupt," "betrayal," "historic," "unprecedented")
- **Call-to-action endings** for each message block
- **Local angles** for regional surrogates (mark as [LOCAL ANGLE])

### **MESSAGE DISCIPLINE NOTES:**
- All surrogates must use EXACT phrasing for key attack lines
- Pivot immediately from defense to offense
- End every answer with forward-looking action
- Time-sensitive: These messages expire at [TIME/DATE]

Focus on creating consistent echo chamber messaging across all surrogates while maintaining authentic candidate voice and local relevance.`,

            'daily-talking-points': `Create TODAY'S Daily Talking Points memo for immediate surrogate distribution:

${baseInfo}

Generate urgent daily messaging coordination document in official campaign format:

**INTERNAL MEMO - CONFIDENTIAL**
**TO:** All Surrogates, Communications Team, Media Liaisons
**FROM:** Communications Director
**DATE:** ${new Date().toLocaleDateString()}
**RE:** URGENT - Daily Message Coordination for ${new Date().toLocaleDateString()} Media Cycle

**IMMEDIATE ACTION REQUIRED - Use These Exact Phrases**

---

## **TODAY'S BREAKING NEWS RESPONSE:**

### **PRIMARY ATTACK (Use in first 30 seconds of any interview):**
"[Breaking news hook tied to opponent's weakness/failure]"

### **STATISTICAL AMMUNITION:**
- **Use this exact stat:** "[Precise number] according to [authoritative source]"
- **Backup stat:** "[Secondary supporting figure] per [different credible source]"
- **Local impact:** "[How this affects constituents numerically]"

---

## **COORDINATED MESSAGING BLOCKS:**

### **BLOCK 1: [MAIN ISSUE TODAY]**
- **Attack Opening:** "[Direct criticism in quotable format]"
- **Evidence:** "[Fact/statistic that proves the attack]"
- **Moral Frame:** "[Why this is wrong/corrupt/harmful]"
- **Sound Bite Closer:** "[10-second quotable conclusion]"

### **BLOCK 2: [SECONDARY PRIORITY]**
- **Setup:** "[Context for why this matters now]"
- **Our Position:** "[Clear statement of candidate's stance]"
- **Contrast:** "[How we're different from opponent]"
- **Action:** "[What we will do/are doing about it]"

---

## **DEFENSIVE RESPONSES (If Asked About):**

### **[POTENTIAL VULNERABILITY #1]:**
**Response Script:** "[Acknowledge briefly] + [Pivot to offense] + [End with our strength]"
**Do NOT:** Spend more than 10 seconds on defense

### **[POTENTIAL VULNERABILITY #2]:**
**Response Script:** "[Dismiss with confidence] + [Redirect to opponent] + [Close with vision]"

---

## **AMPLIFICATION STRATEGY:**

### **Social Media Coordination:**
- **Quote Tweet This:** [Link to ally's tweet]
- **Use These Hashtags:** #[MainTag] #[LocalTag] #[TrendingTag]
- **Retweet Priority:** [Links to 3 key tweets to amplify]

### **Cross-Platform Echo:**
- TV surrogates: Use messaging blocks 1-2 verbatim
- Radio: Focus on statistical ammunition
- Digital: Amplify social media coordination
- Print: Provide full context with background

---

## **TIMING & EXPIRATION:**
- **Valid for:** Next 12 hours only
- **Peak effectiveness:** Morning shows through evening news
- **Expire at:** [Tonight at 11:59 PM]
- **Next memo:** [Tomorrow morning at 6 AM]

### **REMINDER: MESSAGE DISCIPLINE IS CRITICAL**
Every surrogate must use the SAME attack phrases to create coordinated echo across media. Deviation dilutes impact.

**Questions? Contact Communications Director immediately.**

Generate content that creates the coordinated messaging echo chamber effect observed in professional campaign daily operations.`,

            'crisis-response': `Create URGENT Breaking News Crisis Response Talking Points for immediate surrogate distribution:

${baseInfo}

Generate emergency crisis response document in confidential campaign format:

**CONFIDENTIAL - FOR SURROGATES ONLY**
**URGENT: Breaking News Talking Points**

**Date:** ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()} ET
**Re:** Response to [CRISIS/BREAKING NEWS] - IMMEDIATE GUIDANCE
**Distribution:** Tier 1 Surrogates, Cable Bookers, Rapid Response Team
**Contact:** [Campaign Communications Director] - [Phone] - AVAILABLE 24/7

---

## **SITUATION OVERVIEW**
[Brief factual summary of the crisis/breaking news situation]

**KEY IMPERATIVE:** [Primary strategic directive - distance/defend/attack/pivot]

---

## **PRIMARY MESSAGE FOR ALL MEDIA**

**MAIN TALKING POINT:**
"[Exact quote all surrogates must use - unity/strength/leadership message]"

---

## **IF ASKED ABOUT [CRISIS TOPIC]**

### **Option A (Soft Response):**
"[Measured, diplomatic response with pivot]"

### **Option B (Direct Response):**
"[Clear, firm position with contrast]"

### **Option C (Aggressive Pivot):**
"[Strong pivot to opponent's weaknesses]"

---

## **ATTACK LINES ON OPPONENT**

**IF PRESSED ON [VULNERABILITY]:**
- "[Direct counter-attack line with moral framing]"
- "[Statistical/factual ammunition]"
- "[Comparison showing opponent's hypocrisy]"

**STATISTICAL BACKUP:**
- [Precise statistic with authoritative source]
- [Supporting data point that proves our case]

---

## **PIVOT OPPORTUNITIES**

### **Always Pivot Back To:**
1. **Our Strength:** "[Core campaign message/achievement]"
2. **Policy Contrast:** "[How we differ on key issues]"
3. **Forward Message:** "[Vision/hope/progress theme]"

### **DO NOT:**
- [Specific things surrogates must avoid saying]
- [Topics that amplify the crisis]
- [Phrases that create new vulnerabilities]

---

## **DEFENSIVE RESPONSES**

### **If Asked: "[Anticipated tough question 1]"**
"[Prepared response that acknowledges briefly then pivots]"

### **If Asked: "[Anticipated tough question 2]"**
"[Direct response that flips criticism back on opponent]"

### **If Asked: "[Anticipated tough question 3]"**
"[Response that pivots to our agenda/vision]"

---

## **SOCIAL MEDIA AMPLIFICATION**

**APPROVED QUOTES TO SHARE:**
- "[Key quote from candidate/leader]"
- "[Supporting message from speech/statement]"
- "[Unity/strength/vision message]"

**HASHTAGS:** #[CampaignTag] #[ResponseTag] #[IssueTag]

**AMPLIFY THESE ALLIES:**
- [Links to supportive tweets to retweet]
- [Key validators to quote tweet]

---

## **BOOKING GUIDANCE**

### **PRIORITY SHOWS TODAY:**
- **Morning Shows:** [Specific guidance for AM audience]
- **Cable News:** [Strategy for cable appearances]
- **Local TV:** [Local angle emphasis]
- **Digital/Podcasts:** [Online strategy]

### **AVOID:**
- [Shows/topics that amplify crisis]
- [Defensive discussions that hurt message]
- [Speculation that creates new problems]

---

## **EMERGENCY CONTACTS**

**Immediate Questions:** [Communications Director] - [Phone]
**TV Booking Issues:** [Media Relations] - [Phone]
**Fact-Check Support:** [Research Director] - [Phone]
**Crisis Escalation:** [Campaign Manager] - [Phone]

**SECURE BACKUP COMMS:** Signal group "[CrisisResponse][Date]"

---

## **UPDATES EXPECTED:**

- **[Time]:** [Next scheduled update/statement]
- **[Time]:** [Midday guidance adjustment]
- **As needed:** Real-time updates via Signal for breaking developments

---

**REMINDER: This is CONFIDENTIAL campaign material. Do not forward, screenshot, or discuss with non-campaign personnel. All media appearances must be pre-cleared with communications team.**

**MESSAGE DISCIPLINE IS CRITICAL:** Every surrogate must use the SAME response language to create coordinated defense across all media platforms.

Generate crisis response content that ensures unified surrogate messaging during breaking news situations while maintaining strategic focus and message discipline.`
        };

        return templates[contentType] || templates['press-release'];
    }

    // Structure the AI-generated content into blocks
    structureDraft(content, contentType) {
        const blocks = [];
        const lines = content.split('\n').filter(line => line.trim());

        let currentBlock = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Detect headings/titles
            if (this.isHeading(trimmedLine)) {
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = {
                    type: 'heading',
                    content: trimmedLine.replace(/^#+\s*/, ''),
                    level: this.getHeadingLevel(trimmedLine)
                };
            }
            // Detect quotes
            else if (this.isQuote(trimmedLine)) {
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = {
                    type: 'quote',
                    content: trimmedLine.replace(/^"?/, '').replace(/"?$/, ''),
                    author: this.extractQuoteAuthor(trimmedLine) || '[CANDIDATE NAME]',
                    context: 'Campaign statement'
                };
            }
            // Detect policy sections
            else if (this.isPolicyContent(trimmedLine)) {
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = {
                    type: 'policy',
                    content: trimmedLine,
                    title: this.extractPolicyTitle(trimmedLine),
                    audience: 'general'
                };
            }
            // Regular text paragraphs
            else if (trimmedLine.length > 0) {
                if (!currentBlock || currentBlock.type !== 'text') {
                    if (currentBlock) blocks.push(currentBlock);
                    currentBlock = {
                        type: 'text',
                        content: trimmedLine
                    };
                } else {
                    currentBlock.content += '\n\n' + trimmedLine;
                }
            }
        }

        if (currentBlock) blocks.push(currentBlock);

        // Ensure we have at least a basic structure
        if (blocks.length === 0) {
            blocks.push({
                type: 'text',
                content: content || 'Draft content will be generated here based on your assignment brief.'
            });
        }

        return {
            blocks,
            metadata: {
                generatedAt: new Date().toISOString(),
                contentType,
                wordCount: this.countWords(content),
                estimatedReadTime: this.estimateReadTime(content)
            }
        };
    }

    // Helper methods for content detection
    isHeading(line) {
        return /^#{1,6}\s/.test(line) ||
               /^[A-Z\s]+$/.test(line) && line.length < 100 ||
               line.endsWith(':') && line.length < 80;
    }

    getHeadingLevel(line) {
        const match = line.match(/^#{1,6}/);
        return match ? match[0].length : 2;
    }

    isQuote(line) {
        return line.includes('[CANDIDATE QUOTE]') ||
               line.includes('"') && line.length > 20 ||
               line.toLowerCase().includes('said') ||
               line.toLowerCase().includes('stated');
    }

    extractQuoteAuthor(line) {
        // Extract author from quote context
        const patterns = [
            /said\s+(.+?)[,.]/,
            /according to\s+(.+?)[,.]/,
            /\-\s*(.+?)$/
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    isPolicyContent(line) {
        const policyKeywords = [
            'policy', 'plan', 'proposal', 'initiative', 'program',
            'will', 'support', 'oppose', 'implement', 'establish'
        ];
        const lowerLine = line.toLowerCase();
        return policyKeywords.some(keyword => lowerLine.includes(keyword)) && line.length > 50;
    }

    extractPolicyTitle(line) {
        // Extract a title from policy content
        const sentences = line.split(/[.!?]/);
        return sentences[0].trim().substring(0, 60) + (sentences[0].length > 60 ? '...' : '');
    }

    countWords(text) {
        return text ? text.split(/\s+/).length : 0;
    }

    estimateReadTime(text) {
        const words = this.countWords(text);
        return Math.ceil(words / 200); // 200 WPM average reading speed
    }

    // Fallback drafts for when AI is unavailable
    getFallbackDraft(assignment, contentType) {
        const fallbackTemplates = {
            'press-release': {
                blocks: [
                    {
                        type: 'heading',
                        content: `FOR IMMEDIATE RELEASE`,
                        level: 1
                    },
                    {
                        type: 'text',
                        content: `Date: ${new Date().toLocaleDateString()}\n\nContact: [Name], Communications Director\nPhone: (XXX) XXX-XXXX\nEmail: [email@campaign.com]`
                    },
                    {
                        type: 'heading',
                        content: `${assignment.title || 'CANDIDATE ANNOUNCES [MAJOR INITIATIVE/POSITION]'}`.toUpperCase(),
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `*${assignment.keyMessages?.[0] || 'Subheadline providing additional context about the announcement'}*`
                    },
                    {
                        type: 'text',
                        content: `**[CITY, State]** – ${assignment.brief || '[Strong opening paragraph that answers WHO, WHAT, WHEN, WHERE, WHY in 25-35 words. This should be the most newsworthy information that could stand alone as the entire story.]'}`
                    },
                    {
                        type: 'text',
                        content: `[Second paragraph: Expand on the lead with more details and context. Include the most important supporting information about policy positions, timeline, or community impact.]`
                    },
                    {
                        type: 'quote',
                        content: assignment.keyMessages?.[0] || 'This is a compelling quote that captures the key message and provides human perspective. The quote should be authentic, newsworthy, and advance the story.',
                        author: '[CANDIDATE NAME], [TITLE]',
                        context: 'Campaign statement'
                    },
                    {
                        type: 'text',
                        content: `[Additional details paragraph: Provide background information, supporting data, policy positions, or biographical information relevant to the story.]`
                    },
                    {
                        type: 'text',
                        content: `[Call to action: Direct readers to specific actions - visit website, attend event, donate, volunteer, etc.]`
                    },
                    {
                        type: 'text',
                        content: `**About [CANDIDATE/CAMPAIGN]:** Standard 2-3 sentence description of candidate, key qualifications, and campaign mission that appears in every release.\n\n###`
                    }
                ]
            },
            'press-advisory': {
                blocks: [
                    {
                        type: 'heading',
                        content: `MEDIA ADVISORY`,
                        level: 1
                    },
                    {
                        type: 'text',
                        content: `Contact: [Name], Communications Director\nPhone: (XXX) XXX-XXXX\nEmail: [email@campaign.com]`
                    },
                    {
                        type: 'heading',
                        content: `${assignment.title || '[CANDIDATE] TO [ACTION VERB] [EVENT/ANNOUNCEMENT]'}`.toUpperCase(),
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `*${assignment.keyMessages?.[0] || 'Event subtitle with location and time details'}*`
                    },
                    {
                        type: 'text',
                        content: `${assignment.brief || 'Brief description of why this event is newsworthy and worth covering, providing context for reporters to understand significance.'}`
                    },
                    {
                        type: 'text',
                        content: `**WHAT:** ${assignment.title || '[Event description - rally, press conference, town hall, etc.]'}\n\n**WHO:** ${assignment.candidateProfile?.name || '[CANDIDATE NAME]'}, notable speakers, special guests\n\n**WHEN:** [Day of week, full date, time with time zone]\n\n**WHERE:** [Venue name, full address, parking/access information]\n\n**WHY:** ${assignment.keyMessages?.[0] || '[Why this event matters, what will be announced or discussed]'}`
                    },
                    {
                        type: 'text',
                        content: `**MEDIA OPPORTUNITIES:**\n- Photo opportunities available\n- [CANDIDATE] available for interviews following event\n- Live stream information: [if available]\n- Advance interview opportunities: [if available]`
                    },
                    {
                        type: 'text',
                        content: `**LOGISTICS:**\n- Media arrival time: [30 minutes before event]\n- Set-up time for cameras and equipment\n- Parking: [specific instructions]\n- RSVP: [required by date/time] to [contact]`
                    },
                    {
                        type: 'text',
                        content: `**About [CANDIDATE/CAMPAIGN]:** Brief campaign description\n\n###`
                    }
                ]
            },
            'blog-post': {
                blocks: [
                    {
                        type: 'heading',
                        content: assignment.title || 'Our Commitment to the Community',
                        level: 1
                    },
                    {
                        type: 'text',
                        content: `${assignment.brief || 'Today I want to talk about an issue that affects all of us in our community.'} [OPENING HOOK - Add personal connection or current event tie-in]`
                    },
                    {
                        type: 'heading',
                        content: 'Why This Matters',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `[EXPAND ON KEY MESSAGE] - ${assignment.keyMessages?.join('. ') || 'Detail the importance and impact of this issue.'}`
                    },
                    {
                        type: 'heading',
                        content: 'Moving Forward Together',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `[CALL TO ACTION] - Here's how we can work together to make a difference in our community.`
                    }
                ]
            },
            'talking-points': {
                blocks: [
                    {
                        type: 'heading',
                        content: `${assignment.title || 'Daily Talking Points'} - ${new Date().toLocaleDateString()}`,
                        level: 1
                    },
                    {
                        type: 'heading',
                        content: 'TOP MESSAGING PRIORITIES',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `**1. ${assignment.keyMessages?.[0] || '[PRIMARY ISSUE]'}**\n- "${assignment.brief || '[Opening attack line/key position in quotes ready for TV]'}"\n- **Key stat to use:** "[Specific statistic] according to [credible source]"\n- **Sound bite:** "[Punchy, quotable closer that fits in 10 seconds]"`
                    },
                    {
                        type: 'heading',
                        content: 'KEY LINES FOR SURROGATES',
                        level: 2
                    },
                    {
                        type: 'quote',
                        content: assignment.keyMessages?.[0] || 'This is about doing what\'s right for our community.',
                        author: '[ALL SURROGATES MUST USE THIS EXACT PHRASE]',
                        context: 'Coordinated messaging'
                    },
                    {
                        type: 'heading',
                        content: 'IF ASKED ABOUT [DEFENSIVE TOPIC]',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `"[Prepared defensive response that pivots to offense]"`
                    },
                    {
                        type: 'heading',
                        content: 'SUPPORTING SOCIAL MEDIA CONTENT',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `- Links to amplifying tweets from key allies\n- Pre-approved hashtags: #CampaignTag #LocalTag #IssueTag\n- Shareable graphics and quotes available at [LINK]`
                    },
                    {
                        type: 'heading',
                        content: 'MESSAGE DISCIPLINE NOTES',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `- All surrogates must use EXACT phrasing for key attack lines\n- Pivot immediately from defense to offense\n- End every answer with forward-looking action\n- Time-sensitive: These messages expire at [TIME/DATE]`
                    }
                ]
            },
            'daily-talking-points': {
                blocks: [
                    {
                        type: 'heading',
                        content: `INTERNAL MEMO - CONFIDENTIAL`,
                        level: 1
                    },
                    {
                        type: 'text',
                        content: `**TO:** All Surrogates, Communications Team, Media Liaisons\n**FROM:** Communications Director\n**DATE:** ${new Date().toLocaleDateString()}\n**RE:** URGENT - Daily Message Coordination for ${new Date().toLocaleDateString()} Media Cycle\n\n**IMMEDIATE ACTION REQUIRED - Use These Exact Phrases**`
                    },
                    {
                        type: 'heading',
                        content: 'TODAY\'S BREAKING NEWS RESPONSE',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `**PRIMARY ATTACK (Use in first 30 seconds of any interview):**\n"${assignment.brief || '[Breaking news hook tied to opponent\'s weakness/failure]'}"\n\n**STATISTICAL AMMUNITION:**\n- **Use this exact stat:** "[Precise number] according to [authoritative source]"\n- **Local impact:** "[How this affects constituents numerically]"`
                    },
                    {
                        type: 'heading',
                        content: 'COORDINATED MESSAGING BLOCKS',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `**BLOCK 1: ${assignment.keyMessages?.[0] || '[MAIN ISSUE TODAY]'}**\n- **Attack Opening:** "[Direct criticism in quotable format]"\n- **Evidence:** "[Fact/statistic that proves the attack]"\n- **Sound Bite Closer:** "[10-second quotable conclusion]"`
                    },
                    {
                        type: 'heading',
                        content: 'TIMING & EXPIRATION',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `- **Valid for:** Next 12 hours only\n- **Peak effectiveness:** Morning shows through evening news\n- **Expire at:** Tonight at 11:59 PM\n\n**REMINDER: MESSAGE DISCIPLINE IS CRITICAL**\nEvery surrogate must use the SAME attack phrases to create coordinated echo across media.`
                    }
                ]
            },
            'crisis-response': {
                blocks: [
                    {
                        type: 'heading',
                        content: `CONFIDENTIAL - FOR SURROGATES ONLY`,
                        level: 1
                    },
                    {
                        type: 'heading',
                        content: `URGENT: Breaking News Talking Points`,
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `**Date:** ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()} ET\n**Re:** Response to ${assignment.title || '[CRISIS/BREAKING NEWS]'} - IMMEDIATE GUIDANCE\n**Distribution:** Tier 1 Surrogates, Cable Bookers, Rapid Response Team\n**Contact:** [Campaign Communications Director] - [Phone] - AVAILABLE 24/7`
                    },
                    {
                        type: 'heading',
                        content: 'SITUATION OVERVIEW',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `${assignment.brief || '[Brief factual summary of the crisis/breaking news situation]'}\n\n**KEY IMPERATIVE:** [Primary strategic directive - distance/defend/attack/pivot]`
                    },
                    {
                        type: 'heading',
                        content: 'PRIMARY MESSAGE FOR ALL MEDIA',
                        level: 2
                    },
                    {
                        type: 'quote',
                        content: assignment.keyMessages?.[0] || 'We are focused on moving forward and serving the American people.',
                        author: '[EXACT QUOTE ALL SURROGATES MUST USE]',
                        context: 'Primary unified message'
                    },
                    {
                        type: 'heading',
                        content: 'IF ASKED ABOUT [CRISIS TOPIC]',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `**Option A (Soft Response):** "[Measured, diplomatic response with pivot]"\n\n**Option B (Direct Response):** "[Clear, firm position with contrast]"\n\n**Option C (Aggressive Pivot):** "[Strong pivot to opponent's weaknesses]"`
                    },
                    {
                        type: 'heading',
                        content: 'DEFENSIVE RESPONSES',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `**If Asked:** "[Anticipated tough question]"\n**Response:** "[Prepared response that acknowledges briefly then pivots]"`
                    },
                    {
                        type: 'heading',
                        content: 'DO NOT',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `- [Specific things surrogates must avoid saying]\n- [Topics that amplify the crisis]\n- [Phrases that create new vulnerabilities]`
                    },
                    {
                        type: 'heading',
                        content: 'EMERGENCY CONTACTS',
                        level: 2
                    },
                    {
                        type: 'text',
                        content: `**Immediate Questions:** [Communications Director] - [Phone]\n**Crisis Escalation:** [Campaign Manager] - [Phone]\n**SECURE COMMS:** Signal group "[CrisisResponse][Date]"\n\n**REMINDER:** This is CONFIDENTIAL campaign material. MESSAGE DISCIPLINE IS CRITICAL.`
                    }
                ]
            }
        };

        const template = fallbackTemplates[contentType] || fallbackTemplates['press-release'];

        return {
            blocks: template.blocks,
            metadata: {
                generatedAt: new Date().toISOString(),
                contentType,
                wordCount: this.countWords(JSON.stringify(template.blocks)),
                estimatedReadTime: 2,
                fallback: true
            }
        };
    }

    // Generate content-type specific suggestions
    async generateContentSuggestions(assignment, contentType) {
        const suggestions = {
            'press-release': [
                'Ensure headline is under 10 words and captures news value',
                'Lead paragraph must answer WHO, WHAT, WHEN, WHERE, WHY in 25-35 words',
                'Include compelling candidate quote that advances the story',
                'Add stakeholder/community quote for third-party validation',
                'Follow AP Style formatting throughout',
                'Keep to 300-500 words for optimal media pickup',
                'Include specific data points and statistics with sources',
                'Add clear call-to-action directing readers to next steps',
                'End with ### notation and complete boilerplate',
                'Make immediately publishable by outlets with minimal editing'
            ],
            'press-advisory': [
                'Send initial advisory 5-7 days before event, reminder day before',
                'Keep to one page maximum (100-150 words)',
                'Include compelling case for why media should attend',
                'Provide complete logistics: arrival time, parking, setup',
                'Specify photo opportunities and interview availability',
                'Include RSVP requirements and contact information',
                'Add weather contingency plans for outdoor events',
                'Target specific local journalists who cover relevant beats',
                'Follow up with personal phone calls to key media contacts',
                'Provide driving directions and public transit options',
                'Include credential requirements for security/access',
                'Make clear what will be announced or discussed at event'
            ],
            'blog-post': [
                'Include a personal story or anecdote',
                'Add specific examples from your experience',
                'Consider including photos or visual elements',
                'Link to relevant policy pages or resources',
                'End with a clear next step for readers'
            ],
            'speech': [
                'Practice timing - aim for [X] minutes total',
                'Add moments for audience interaction',
                'Include local references and community specifics',
                'Plan transitions between major sections',
                'Prepare for potential questions'
            ],
            'talking-points': [
                'Ensure all surrogates use EXACT same attack phrases',
                'Fact-check all statistics and claims with credible sources',
                'Create TV-ready sound bites under 10 seconds',
                'Add local angles and constituency-specific impacts',
                'Develop defensive pivot responses to anticipated attacks',
                'Coordinate social media amplification strategy',
                'Set expiration timing for message relevance',
                'Include backup statistical ammunition'
            ],
            'daily-talking-points': [
                'Respond to TODAY\'S breaking news cycle immediately',
                'Ensure message discipline across ALL surrogates',
                'Create coordinated echo chamber effect across media',
                'Include precise statistics with authoritative sources',
                'Develop defensive responses that pivot to offense',
                'Set 12-hour expiration for urgent messaging',
                'Coordinate cross-platform amplification strategy',
                'Use emotional language choices strategically',
                'End every message with forward-looking action',
                'Prepare backup messaging for unexpected developments'
            ],
            'crisis-response': [
                'Deploy within 2 hours of breaking crisis',
                'Provide 3 response options for different contexts',
                'Create clear DO NOT list to prevent message drift',
                'Include emergency contacts for real-time guidance',
                'Prepare defensive responses to anticipated questions',
                'Establish secure communication channels for updates',
                'Set booking guidance for different show types',
                'Include statistical backup for counter-attacks',
                'Create social media amplification strategy',
                'Establish update schedule for evolving situations',
                'Maintain confidentiality and message discipline',
                'Prepare pivot opportunities to favorable topics'
            ]
        };

        return suggestions[contentType] || suggestions['press-release'];
    }
}

module.exports = new DraftGenerator();
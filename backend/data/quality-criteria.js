/**
 * Assignment-Specific Quality Evaluation Criteria
 * Detailed evaluation standards based on political communication best practices
 */

const qualityCriteria = {

    // Political Statement Quality Criteria
    statement: {
        critical_requirements: [
            {
                name: "Clear Opening Position",
                description: "Statement must lead with candidate's position, not the controversy or problem",
                check: (content) => {
                    const firstSentence = content.split('.')[0];
                    return {
                        passes: firstSentence && firstSentence.length > 30 && !firstSentence.toLowerCase().includes('respond'),
                        message: firstSentence.length < 30 ?
                            "Opening sentence too brief - should clearly state position" :
                            firstSentence.toLowerCase().includes('respond') ?
                            "Avoid leading with response language - state your position first" : null
                    };
                },
                weight: 25
            },
            {
                name: "Evidence and Support",
                description: "Must include specific facts, statistics, or concrete evidence",
                check: (content) => {
                    const hasNumbers = /\b\d+([,.]?\d+)*(\s*%|\s*percent|\s*million|\s*billion|\s*thousand)?\b/.test(content);
                    const hasQuotes = /"[^"]{20,}"/.test(content);
                    const hasSpecificFacts = /\b(study|research|report|data|according to)\b/i.test(content);

                    const evidenceCount = [hasNumbers, hasQuotes, hasSpecificFacts].filter(Boolean).length;

                    return {
                        passes: evidenceCount >= 1,
                        message: evidenceCount === 0 ?
                            "Missing concrete evidence - add statistics, quotes, or specific facts" :
                            evidenceCount === 1 ?
                            "Good evidence present - consider adding more supporting data" : null
                    };
                },
                weight: 20
            },
            {
                name: "Local Impact Connection",
                description: "Should connect issue to local community impact and examples",
                check: (content) => {
                    const localWords = ['community', 'local', 'neighborhood', 'families', 'residents', 'district', 'county', 'city'];
                    const localCount = localWords.filter(word =>
                        content.toLowerCase().includes(word)
                    ).length;

                    return {
                        passes: localCount >= 2,
                        message: localCount === 0 ?
                            "Add local community impact and examples" :
                            localCount === 1 ?
                            "Good local connection - consider adding more specific community examples" : null
                    };
                },
                weight: 15
            },
            {
                name: "Forward-Looking Action",
                description: "Must end with clear next steps or call to action",
                check: (content) => {
                    const lastParagraph = content.split('\n\n').slice(-1)[0];
                    const actionWords = ['will', 'must', 'should', 'call on', 'urge', 'support', 'plan to', 'continue to'];
                    const hasAction = actionWords.some(word =>
                        lastParagraph.toLowerCase().includes(word)
                    );

                    return {
                        passes: hasAction,
                        message: hasAction ? null : "Add clear call to action or next steps in conclusion"
                    };
                },
                weight: 20
            }
        ],

        quality_indicators: [
            {
                name: "Active Voice Usage",
                description: "Prefer active voice over passive for stronger messaging",
                check: (content) => {
                    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
                    const passiveCount = sentences.filter(sentence =>
                        /\b(is|are|was|were|been|being)\s+\w+ed\b/.test(sentence)
                    ).length;
                    const activeRatio = 1 - (passiveCount / sentences.length);

                    return {
                        score: Math.round(activeRatio * 100),
                        message: activeRatio < 0.7 ?
                            `${Math.round(passiveCount/sentences.length * 100)}% passive voice - use more direct, active language` :
                            `Good active voice usage (${Math.round(activeRatio * 100)}%)`
                    };
                },
                weight: 10
            },
            {
                name: "Message Discipline",
                description: "Consistent messaging that stays on brand and avoids mixed signals",
                check: (content, briefData) => {
                    if (!briefData || !briefData.main_message) {
                        return { score: 80, message: "No brief data available for comparison" };
                    }

                    const coreMessage = briefData.main_message.toLowerCase();
                    const contentLower = content.toLowerCase();
                    const keyWords = coreMessage.split(' ').filter(word => word.length > 4);
                    const matchingWords = keyWords.filter(word => contentLower.includes(word));
                    const alignmentRatio = matchingWords.length / keyWords.length;

                    return {
                        score: Math.round(alignmentRatio * 100),
                        message: alignmentRatio < 0.4 ?
                            "Content doesn't clearly reflect core message from brief" :
                            alignmentRatio > 0.7 ?
                            "Strong alignment with core message" :
                            "Moderate alignment - consider strengthening key message themes"
                    };
                },
                weight: 15
            },
            {
                name: "Tone Appropriateness",
                description: "Tone matches brief requirements and avoids defensive language",
                check: (content, briefData) => {
                    const defensiveWords = ['deny', 'false', 'untrue', 'incorrect', 'wrong', 'refuse', 'reject'];
                    const defensiveCount = defensiveWords.reduce((count, word) => {
                        return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
                    }, 0);

                    let toneScore = 100 - (defensiveCount * 15);
                    let message = '';

                    if (defensiveCount > 2) {
                        message = "Too much defensive language - focus on positive positioning";
                        toneScore = Math.max(30, toneScore);
                    } else if (defensiveCount === 0) {
                        message = "Excellent positive tone";
                    } else {
                        message = "Minimal defensive language - consider alternatives";
                    }

                    return { score: Math.max(0, toneScore), message };
                },
                weight: 10
            }
        ],

        length_standards: {
            brief: { min: 100, max: 200, optimal: 150 },
            standard: { min: 200, max: 400, optimal: 300 },
            comprehensive: { min: 400, max: 600, optimal: 500 }
        }
    },

    // Daily Talking Points Quality Criteria
    talking_points_daily: {
        critical_requirements: [
            {
                name: "Message of the Day Present",
                description: "Must have clear, memorable MOTD under 150 characters",
                check: (content) => {
                    const hasMOTD = content.includes('MESSAGE OF THE DAY') || content.includes('MOTD');
                    if (!hasMOTD) {
                        return { passes: false, message: "Missing Message of the Day section - essential for talking points" };
                    }

                    // Extract MOTD content
                    const motdMatch = content.match(/MESSAGE OF THE DAY[:\s]*(.*?)(?=\n\n|\nTODAY'S|$)/s);
                    if (motdMatch) {
                        const motdContent = motdMatch[1].trim();
                        return {
                            passes: motdContent.length > 10 && motdContent.length < 150,
                            message: motdContent.length < 10 ?
                                "MOTD too brief - should be a complete, memorable sentence" :
                                motdContent.length > 150 ?
                                "MOTD too long - keep under 150 characters for memorability" : null
                        };
                    }

                    return { passes: true, message: null };
                },
                weight: 30
            },
            {
                name: "Priority Structure",
                description: "Maximum 3 priority messages with clear hierarchy",
                check: (content) => {
                    const priorityMatches = content.match(/\d+\.\s*[A-Z][^:]*:/g) || [];
                    const priorityCount = priorityMatches.length;

                    return {
                        passes: priorityCount >= 1 && priorityCount <= 3,
                        message: priorityCount === 0 ?
                            "Missing priority messages structure" :
                            priorityCount > 3 ?
                            `Too many priorities (${priorityCount}) - limit to 3 for message discipline` : null
                    };
                },
                weight: 25
            },
            {
                name: "Opposition Response Guidance",
                description: "Must include 'if asked' scenarios and pivot strategies",
                check: (content) => {
                    const hasOpposition = content.toLowerCase().includes('if asked') ||
                                        content.toLowerCase().includes('opposition') ||
                                        content.toLowerCase().includes('pivot');

                    return {
                        passes: hasOpposition,
                        message: hasOpposition ? null : "Include 'if asked' scenarios and pivot strategies for surrogates"
                    };
                },
                weight: 20
            },
            {
                name: "Classification and Distribution",
                description: "Proper classification header and distribution guidance",
                check: (content) => {
                    const hasClassification = content.includes('CONFIDENTIAL') ||
                                           content.includes('RESTRICTED') ||
                                           content.includes('INTERNAL');
                    const hasTier = content.toLowerCase().includes('tier') ||
                                   content.toLowerCase().includes('distribution');

                    return {
                        passes: hasClassification,
                        message: hasClassification ?
                            !hasTier ? "Consider adding distribution tier guidance" : null :
                            "Add classification header (CONFIDENTIAL, etc.)"
                    };
                },
                weight: 15
            }
        ],

        quality_indicators: [
            {
                name: "Quick Hitter Count",
                description: "5-7 bullet point sound bites for media use",
                check: (content) => {
                    const bullets = (content.match(/^[\s]*[•·\-\*]/gm) || []).length;
                    const score = bullets >= 5 && bullets <= 7 ? 100 :
                                 bullets >= 3 && bullets <= 9 ? 70 :
                                 bullets >= 1 ? 50 : 0;

                    return {
                        score,
                        message: bullets === 0 ?
                            "Missing quick hitters - add 5-7 bullet point sound bites" :
                            bullets < 5 ?
                            `Add more quick hitters (${bullets}/5-7)` :
                            bullets > 7 ?
                            `Too many quick hitters (${bullets}) - focus on best 5-7` :
                            `Perfect quick hitter count (${bullets})`
                    };
                },
                weight: 15
            },
            {
                name: "Surrogate-Friendly Language",
                description: "Language that surrogates can easily remember and repeat",
                check: (content) => {
                    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
                    const longSentences = sentences.filter(s => s.split(' ').length > 20).length;
                    const complexWords = (content.match(/\b\w{12,}\b/g) || []).length;
                    const jargonWords = (content.match(/\b(implementation|infrastructure|comprehensive|facilitate)\b/g) || []).length;

                    let score = 100 - (longSentences * 5) - (complexWords * 2) - (jargonWords * 5);

                    return {
                        score: Math.max(0, score),
                        message: score < 70 ? "Simplify language for surrogate use - shorter sentences, fewer complex terms" :
                                score > 85 ? "Excellent surrogate-friendly language" :
                                "Good clarity - consider simplifying further"
                    };
                },
                weight: 10
            }
        ]
    },

    // Crisis Talking Points Quality Criteria
    talking_points_crisis: {
        critical_requirements: [
            {
                name: "Immediate Response Script",
                description: "Exact language for first response in crisis",
                check: (content) => {
                    const hasImmediate = content.includes('IMMEDIATE RESPONSE') ||
                                       content.includes('Use Exactly');

                    return {
                        passes: hasImmediate,
                        message: hasImmediate ? null : "Missing immediate response script - critical for crisis talking points"
                    };
                },
                weight: 35
            },
            {
                name: "Pivot Strategy",
                description: "Clear strategy to redirect to positive messaging",
                check: (content) => {
                    const hasPivot = content.toLowerCase().includes('pivot') ||
                                   content.toLowerCase().includes('redirect') ||
                                   content.toLowerCase().includes('real issue');

                    return {
                        passes: hasPivot,
                        message: hasPivot ? null : "Missing pivot strategy to redirect from crisis to positive message"
                    };
                },
                weight: 25
            },
            {
                name: "Legal/Restriction Guidance",
                description: "Clear guidance on what not to say or discuss",
                check: (content) => {
                    const hasRestrictions = content.toLowerCase().includes('avoid') ||
                                          content.toLowerCase().includes('do not') ||
                                          content.toLowerCase().includes('restrict');

                    return {
                        passes: hasRestrictions,
                        message: hasRestrictions ? null : "Include clear restrictions on what not to discuss"
                    };
                },
                weight: 20
            },
            {
                name: "Escalation Triggers",
                description: "When to escalate to senior staff or designated spokesperson",
                check: (content) => {
                    const hasEscalation = content.toLowerCase().includes('escalat') ||
                                        content.toLowerCase().includes('refer') ||
                                        content.toLowerCase().includes('senior staff');

                    return {
                        passes: hasEscalation,
                        message: hasEscalation ? null : "Add escalation guidance for complex questions"
                    };
                },
                weight: 20
            }
        ],

        quality_indicators: [
            {
                name: "Response Brevity",
                description: "Crisis responses should be concise and clear",
                check: (content) => {
                    const responseMatch = content.match(/IMMEDIATE RESPONSE[^:]*:(.*?)(?=\n[A-Z]|\n\n|$)/s);
                    if (!responseMatch) return { score: 50, message: "Cannot analyze - missing immediate response section" };

                    const responseLength = responseMatch[1].trim().length;
                    const score = responseLength < 200 ? 100 :
                                 responseLength < 300 ? 80 :
                                 responseLength < 400 ? 60 : 30;

                    return {
                        score,
                        message: responseLength > 300 ?
                            "Immediate response too long - keep crisis responses brief and punchy" :
                            "Good response length for crisis communication"
                    };
                },
                weight: 15
            }
        ]
    },

    // Speech Quality Criteria
    speech: {
        critical_requirements: [
            {
                name: "Audience Engagement Elements",
                description: "Speech must include audience interaction and applause lines",
                check: (content) => {
                    const engagementElements = ['[APPLAUSE]', '[PAUSE]', 'Thank you', 'Let me tell you'];
                    const hasEngagement = engagementElements.some(element =>
                        content.includes(element) || content.toLowerCase().includes(element.toLowerCase())
                    );

                    return {
                        passes: hasEngagement,
                        message: hasEngagement ? null : "Add audience engagement elements like applause lines and pauses"
                    };
                },
                weight: 25
            },
            {
                name: "Teleprompter Formatting",
                description: "Proper formatting for teleprompter delivery",
                check: (content) => {
                    const hasCues = content.includes('[') || content.includes('(');
                    const hasShortLines = content.split('\n').some(line =>
                        line.trim().length > 10 && line.trim().length < 80
                    );

                    return {
                        passes: hasCues && hasShortLines,
                        message: !hasCues ? "Add delivery cues in brackets [PAUSE], [EMPHASIS]" :
                                !hasShortLines ? "Break up long lines for teleprompter readability" : null
                    };
                },
                weight: 20
            },
            {
                name: "Clear Opening Hook",
                description: "Strong opening that grabs audience attention",
                check: (content) => {
                    const firstParagraph = content.split('\n\n')[0];
                    const hookWords = ['Today', 'Friends', 'Thank you', 'Let me', 'I\'m here'];
                    const hasHook = hookWords.some(word =>
                        firstParagraph.toLowerCase().includes(word.toLowerCase())
                    );

                    return {
                        passes: hasHook && firstParagraph.length > 50,
                        message: !hasHook ? "Start with a strong audience connection" :
                                firstParagraph.length < 50 ? "Expand opening for stronger audience connection" : null
                    };
                },
                weight: 15
            },
            {
                name: "Memorable Conclusion",
                description: "Strong closing that leaves lasting impression",
                check: (content) => {
                    const lastParagraph = content.split('\n\n').slice(-1)[0];
                    const closingWords = ['Together', 'Thank you', 'God bless', 'Let\'s', 'Join me'];
                    const hasClosing = closingWords.some(word =>
                        lastParagraph.toLowerCase().includes(word.toLowerCase())
                    );

                    return {
                        passes: hasClosing && lastParagraph.length > 30,
                        message: !hasClosing ? "Add memorable closing that inspires action" :
                                lastParagraph.length < 30 ? "Expand conclusion for stronger finish" : null
                    };
                },
                weight: 15
            }
        ],

        quality_indicators: [
            {
                name: "Speaking Time Estimate",
                description: "Appropriate length for speaking engagement",
                check: (content) => {
                    const wordCount = content.split(/\s+/).length;
                    const estimatedMinutes = Math.round(wordCount / 150); // ~150 words per minute

                    let score = 100;
                    let message = `Estimated speaking time: ${estimatedMinutes} minutes`;

                    if (estimatedMinutes < 3) {
                        score = 60;
                        message += " - Consider expanding for more substantial content";
                    } else if (estimatedMinutes > 20) {
                        score = 70;
                        message += " - Consider shortening to maintain audience attention";
                    } else if (estimatedMinutes >= 5 && estimatedMinutes <= 15) {
                        message += " - Ideal length for most occasions";
                    }

                    return { score, message };
                },
                weight: 10
            }
        ]
    },

    // Press Release Quality Criteria
    press_release: {
        critical_requirements: [
            {
                name: "Inverted Pyramid Structure",
                description: "Most newsworthy information in first paragraph",
                check: (content) => {
                    const firstParagraph = content.split('\n\n')[0];
                    const hasWhoWhatWhen = ['who', 'what', 'when', 'where'].filter(word => {
                        // Check if the concept is covered, not just the literal word
                        return firstParagraph.length > 100; // Basic check for completeness
                    }).length > 0;

                    return {
                        passes: hasWhoWhatWhen && firstParagraph.length >= 50 && firstParagraph.length <= 250,
                        message: firstParagraph.length < 50 ?
                            "Lead paragraph too brief - include who, what, when, where" :
                            firstParagraph.length > 250 ?
                            "Lead paragraph too long - frontload most newsworthy information" : null
                    };
                },
                weight: 30
            },
            {
                name: "Attributed Quotes",
                description: "Must include properly attributed quotes from relevant sources",
                check: (content) => {
                    const quotePattern = /"[^"]{20,}"/g;
                    const quotes = content.match(quotePattern) || [];
                    const attributions = (content.match(/said|according to|stated|commented/gi) || []).length;

                    return {
                        passes: quotes.length >= 1 && attributions >= quotes.length,
                        message: quotes.length === 0 ?
                            "Add quoted statements from candidate or spokesperson" :
                            attributions < quotes.length ?
                            "Ensure all quotes are properly attributed" : null
                    };
                },
                weight: 25
            },
            {
                name: "News Value and Timeliness",
                description: "Clear news hook and timely relevance",
                check: (content) => {
                    const timeWords = ['today', 'announced', 'released', 'unveiled', 'launched'];
                    const newsWords = ['first', 'new', 'major', 'significant', 'historic'];

                    const hasTimeliness = timeWords.some(word =>
                        content.toLowerCase().includes(word)
                    );
                    const hasNewsValue = newsWords.some(word =>
                        content.toLowerCase().includes(word)
                    );

                    return {
                        passes: hasTimeliness || hasNewsValue,
                        message: !hasTimeliness && !hasNewsValue ?
                            "Add clear news hook - why is this newsworthy today?" : null
                    };
                },
                weight: 20
            },
            {
                name: "Contact Information",
                description: "Media contact information for follow-up",
                check: (content) => {
                    const hasContact = content.toLowerCase().includes('contact') ||
                                     content.toLowerCase().includes('media') ||
                                     content.toLowerCase().includes('press');

                    return {
                        passes: hasContact,
                        message: hasContact ? null : "Add media contact information at end"
                    };
                },
                weight: 15
            }
        ],

        quality_indicators: [
            {
                name: "AP Style Compliance",
                description: "Follows Associated Press style guidelines",
                check: (content) => {
                    let violations = 0;
                    let issues = [];

                    // Check for common AP style issues
                    if (content.includes(' and ') && content.includes(', and ')) {
                        violations++;
                        issues.push("Inconsistent serial comma usage");
                    }

                    // State abbreviation check
                    const stateAbbrevs = content.match(/\b[A-Z]{2}\b/g) || [];
                    if (stateAbbrevs.length > 0) {
                        violations++;
                        issues.push("Use AP state abbreviations in datelines");
                    }

                    const score = Math.max(0, 100 - (violations * 15));

                    return {
                        score,
                        message: violations === 0 ? "Good AP style compliance" :
                                `AP style issues: ${issues.join(', ')}`
                    };
                },
                weight: 10
            }
        ]
    },

    // Social Media Post Quality Criteria
    social_media: {
        critical_requirements: [
            {
                name: "Platform-Appropriate Length",
                description: "Content fits platform character limits and best practices",
                check: (content, platform = 'twitter') => {
                    const limits = {
                        twitter: { max: 280, optimal: 240 },
                        facebook: { max: 500, optimal: 250 },
                        instagram: { max: 2200, optimal: 150 },
                        linkedin: { max: 1300, optimal: 150 }
                    };

                    const limit = limits[platform] || limits.twitter;
                    const length = content.length;

                    return {
                        passes: length <= limit.max,
                        message: length > limit.max ?
                            `Too long for ${platform} (${length}/${limit.max} characters)` :
                            length > limit.optimal ?
                            `Consider shortening for better engagement (${length}/${limit.optimal} optimal)` : null
                    };
                },
                weight: 25
            },
            {
                name: "Clear Call to Action",
                description: "Specific action for audience to take",
                check: (content) => {
                    const actionWords = ['vote', 'share', 'join', 'support', 'sign up', 'donate', 'volunteer', 'learn more'];
                    const hasAction = actionWords.some(word =>
                        content.toLowerCase().includes(word)
                    );

                    return {
                        passes: hasAction,
                        message: hasAction ? null : "Add clear call to action (vote, share, join, etc.)"
                    };
                },
                weight: 20
            },
            {
                name: "Visual-Friendly Content",
                description: "Content works well with images/video",
                check: (content) => {
                    const hasVisualCues = content.includes('[IMAGE]') ||
                                        content.includes('[VIDEO]') ||
                                        content.includes('#') ||
                                        content.toLowerCase().includes('photo') ||
                                        content.toLowerCase().includes('video');

                    return {
                        passes: hasVisualCues,
                        message: hasVisualCues ? null : "Consider adding visual elements or hashtags"
                    };
                },
                weight: 15
            }
        ],

        quality_indicators: [
            {
                name: "Hashtag Usage",
                description: "Appropriate hashtag strategy",
                check: (content, platform = 'twitter') => {
                    const hashtags = (content.match(/#\w+/g) || []).length;
                    const optimalCounts = { twitter: 2, instagram: 10, facebook: 1, linkedin: 3 };
                    const optimal = optimalCounts[platform] || 2;

                    let score = hashtags === optimal ? 100 :
                               hashtags === optimal - 1 || hashtags === optimal + 1 ? 90 :
                               hashtags < optimal ? 70 :
                               hashtags > optimal * 2 ? 50 : 80;

                    return {
                        score,
                        message: hashtags === 0 ?
                            "Add relevant hashtags for better reach" :
                            hashtags > optimal * 2 ?
                            "Too many hashtags - focus on most relevant ones" :
                            `Good hashtag usage (${hashtags})`
                    };
                },
                weight: 10
            }
        ]
    },

    // Op-Ed Quality Criteria
    op_ed: {
        critical_requirements: [
            {
                name: "Strong Thesis Statement",
                description: "Clear argument presented in opening paragraphs",
                check: (content) => {
                    const firstTwoParas = content.split('\n\n').slice(0, 2).join(' ');
                    const hasThesis = firstTwoParas.length > 100 &&
                                    (firstTwoParas.includes('must') ||
                                     firstTwoParas.includes('should') ||
                                     firstTwoParas.includes('need to'));

                    return {
                        passes: hasThesis,
                        message: hasThesis ? null : "Establish clear thesis/argument in opening paragraphs"
                    };
                },
                weight: 25
            },
            {
                name: "Evidence-Based Arguments",
                description: "Supporting evidence and examples for main arguments",
                check: (content) => {
                    const evidenceIndicators = ['according to', 'study shows', 'data reveals', 'research indicates', 'for example'];
                    const evidenceCount = evidenceIndicators.filter(indicator =>
                        content.toLowerCase().includes(indicator)
                    ).length;

                    return {
                        passes: evidenceCount >= 2,
                        message: evidenceCount === 0 ?
                            "Add supporting evidence and examples" :
                            evidenceCount === 1 ?
                            "Good evidence - consider adding more supporting data" : null
                    };
                },
                weight: 25
            },
            {
                name: "Personal Authority/Expertise",
                description: "Establishes author's credibility on the topic",
                check: (content) => {
                    const authorityWords = ['my experience', 'I have seen', 'in my time', 'I know', 'I believe'];
                    const hasAuthority = authorityWords.some(phrase =>
                        content.toLowerCase().includes(phrase)
                    );

                    return {
                        passes: hasAuthority,
                        message: hasAuthority ? null : "Establish personal authority or expertise on the topic"
                    };
                },
                weight: 20
            },
            {
                name: "Compelling Conclusion",
                description: "Strong ending that reinforces thesis and calls for action",
                check: (content) => {
                    const conclusion = content.split('\n\n').slice(-2).join(' ');
                    const conclusionWords = ['must', 'cannot wait', 'time for', 'call on'];
                    const hasStrongEnd = conclusionWords.some(phrase =>
                        conclusion.toLowerCase().includes(phrase)
                    );

                    return {
                        passes: hasStrongEnd && conclusion.length > 100,
                        message: !hasStrongEnd ?
                            "Strengthen conclusion with clear call for action" :
                            conclusion.length < 100 ?
                            "Expand conclusion for stronger impact" : null
                    };
                },
                weight: 15
            }
        ],

        quality_indicators: [
            {
                name: "Publication Length Standards",
                description: "Appropriate length for newspaper op-ed",
                check: (content) => {
                    const wordCount = content.split(/\s+/).length;
                    const score = wordCount >= 600 && wordCount <= 800 ? 100 :
                                 wordCount >= 500 && wordCount <= 900 ? 85 :
                                 wordCount >= 400 && wordCount <= 1000 ? 70 : 50;

                    return {
                        score,
                        message: wordCount < 500 ?
                            `Too brief for op-ed (${wordCount} words) - expand arguments` :
                            wordCount > 900 ?
                            `Too long for most publications (${wordCount} words) - consider cutting` :
                            `Good length for op-ed (${wordCount} words)`
                    };
                },
                weight: 10
            }
        ]
    }
};

module.exports = qualityCriteria;
/**
 * Press Release Type Classifier
 *
 * Detects press release type, subtypes, and issues using pattern matching.
 * This is SYSTEM 1 in the workflow - classification happens before parsing.
 *
 * WORKFLOW:
 * 1. This classifier auto-detects type/subtype/issues
 * 2. Human QC dashboard verifies and corrects
 * 3. Parser receives verified data and extracts structure
 */

class PressReleaseTypeClassifier {
    constructor() {
        // No patterns needed in constructor for now
    }

    /**
     * Main classification method - analyzes text and returns complete categorization
     * @param {string} text - The press release text
     * @param {string} title - Optional title for additional context
     * @returns {object} Classification with type, subtypes, issues, and confidence
     */
    classify(text, title = '') {
        const releaseType = this.detectReleaseType(text);
        const subtypes = this.detectSubtypes(text, releaseType.type);
        const issues = this.detectIssues(text);

        return {
            release_type: releaseType.type,
            confidence: releaseType.confidence,
            score: releaseType.score,
            indicators: releaseType.indicators,
            all_scores: releaseType.all_scores,
            subtypes: subtypes.map(s => s.subtype),
            subtype_details: subtypes,
            issues: issues.map(i => i.issue),
            issue_details: issues
        };
    }

    /**
     * Detect statement format and extract the speaker
     * Pattern: "X released the following statement:" or "Statement from X:"
     * Returns: { speaker: 'Full Name', position: index_where_found }
     */
    detectStatementFormat(text) {
        // UPDATED: Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
        const statementPatterns = [
            // "Representative Alexandria Ocasio-Cortez (NY-14) released a statement"
            // Handles titles + names + district info + "released a statement" (without "the following")
            /(?:Representative|Senator|Congresswoman|Congressman|Governor|Mayor)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s*(?:\([^)]+\))?\s+released\s+a\s+statement/i,
            // "Mikie Sherrill released the following statement:"
            /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+released\s+the\s+following\s+statement/i,
            // "Statement from Mikie Sherrill:"
            /Statement\s+from\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)/i,
            // "Campaign Manager Alex Ball released the following statement"
            /(?:Campaign\s+Manager|Press\s+Secretary|Spokesperson)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+released\s+the\s+following\s+statement/i,
            // "X said in a statement:"
            /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+said\s+in\s+a\s+statement/i
        ];

        for (const pattern of statementPatterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    speaker: match[1].trim(),
                    position: match.index
                };
            }
        }

        return null;
    }

    /**
     * Detect the type of press release
     * Returns: { type: string, confidence: string, indicators: array }
     *
     * Types:
     * - STATEMENT: "X released a statement" format, single speaker
     * - NEWS_RELEASE: Traditional format with dateline, multiple possible speakers
     * - MEDIA_ADVISORY: Event announcement with WHO/WHAT/WHEN/WHERE
     * - LETTER: "Dear X" format
     * - TRANSCRIPT: Speech or Q&A format
     * - FACT_SHEET: Data/bullet point heavy
     * - UNKNOWN: Cannot determine type
     */
    detectReleaseType(text) {
        const indicators = [];
        let scores = {
            STATEMENT: 0,
            NEWS_RELEASE: 0,
            MEDIA_ADVISORY: 0,
            LETTER: 0,
            TRANSCRIPT: 0,
            FACT_SHEET: 0
        };

        // STATEMENT indicators
        if (this.detectStatementFormat(text)) {
            scores.STATEMENT += 10;
            indicators.push('Statement format detected');
        }
        if (text.match(/\breleased\s+(?:a|the\s+following)\s+statement/i)) {
            scores.STATEMENT += 5;
            indicators.push('Contains "released a statement"');
        }
        if (text.match(/^Statement\s+(?:from|by)/im)) {
            scores.STATEMENT += 5;
            indicators.push('Starts with "Statement from/by"');
        }

        // NEWS_RELEASE indicators
        if (text.match(/^[A-Z][a-z\s,]+\s*[–—-]\s*[A-Z]/m)) {
            scores.NEWS_RELEASE += 5;
            indicators.push('Has dateline format');
        }
        if (text.match(/FOR\s+(?:IMMEDIATE\s+)?RELEASE/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Has "FOR IMMEDIATE RELEASE"');
        }
        // Check for multiple potential speakers (quotes with different attribution)
        const attributionMatches = text.match(/(?:said|stated|according to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
        if (attributionMatches && attributionMatches.length >= 2) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Multiple speaker attributions found');
        }
        // "issued the following statement" pattern (news release context, not pure statement)
        if (text.match(/issued\s+the\s+following\s+statement/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains "issued the following statement"');
        }
        // End marker
        if (text.match(/^\s*#{3,}\s*$/m)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Has ### end marker');
        }
        // Third-person narrative verbs (indicates news release vs statement)
        if (text.match(/\b(?:argues|highlights|emphasizes|notes|explains|details|outlines|criticized|challenged)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains third-person narrative verbs');
        }
        // Date patterns (various formats)
        if (text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains formatted date');
        }
        // Location patterns (dateline with dash)
        if (text.match(/^(?:[A-Z][A-Z\s]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:[A-Z]{2}|D\.C\.)?\s*[–—-]/m)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Has location header');
        }
        // Standalone location line (Washington, D.C. or City, STATE)
        if (text.match(/^(?:Washington,?\s+D\.C\.|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z]{2})$/m)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Has standalone location line');
        }
        // Legislative/committee action language
        if (text.match(/\b(?:subcommittee|committee|congress|senate|house)\s+(?:passed|advanced|approved|voted\s+on)\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains legislative action language');
        }
        if (text.match(/\b(?:will|now)\s+(?:move|proceed)(?:s)?\s+to\s+(?:the\s+)?(?:full\s+)?(?:committee|floor|vote|senate|house)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains legislative process language');
        }
        // Organizational/campaign action language
        if (text.match(/\b(?:launched|unveiled|kicked\s+off|rolled\s+out|announced)\s+(?:new|a\s+new)?\s*(?:campaign|initiative|program|billboards?|ads?|effort)/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains organizational action language');
        }
        // Letter/correspondence references
        if (text.match(/\b(?:sent|wrote|delivered)\s+(?:a\s+)?letter\s+to\b|\bpressed?\s+[A-Z][a-zA-Z\s]+\s+(?:on|about)\b|\burged?\s+[A-Z][a-zA-Z\s]+\s+to\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains letter/correspondence reference');
        }
        // Announcement/reveal language
        if (text.match(/\b(?:announced|revealed|disclosed)\s+(?:that|today|yesterday|this\s+week)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains announcement language');
        }
        // News update prefixes (ICYMI, NEW, etc.)
        if (text.match(/^(?:NEW|NEWS|BREAKING|UPDATE|ICYMI|LATEST|PHOTOS|PHOTO|VIDEO|WATCH|LISTEN):/im)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Has news update prefix');
        }
        // Temporal news connections
        if (text.match(/\b(?:on\s+the\s+heels\s+of|following|in\s+response\s+to|after|amid)\s+[a-z]+/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains temporal news connection');
        }
        // Hearing/testimony activity (adds to NEWS_RELEASE confidence)
        if (text.match(/\b(?:at\s+a|questioned?\s+witnesses?\s+at|testimony\s+(?:at|from)|hearing\s+on)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains hearing/testimony activity');
        }
        // Floor speech/action
        if (text.match(/\b(?:delivered|gave)\s+(?:a\s+)?(?:speech|remarks?|address)\s+on\s+the\s+(?:senate|house)\s+floor/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains floor speech reference');
        }
        // Source citations (journalism-style)
        if (text.match(/\b(?:according\s+to|cites?|sources?\s+(?:say|said|include)|as\s+reported\s+by)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains source citations');
        }
        // Press event/conference language
        if (text.match(/\b(?:held|held\s+a|hosted)\s+(?:a\s+)?(?:press\s+event|press\s+conference|media\s+briefing|news\s+conference)/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains press event reference');
        }
        // Bill introduction with cosponsor counts
        if (text.match(/\b(?:introduced|cosponsored\s+by)\s+(?:the\s+)?[\w\s]+\s+(?:by\s+)?\d+\s+(?:senator|representative|member|lawmaker)s?\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains bill introduction with cosponsor count');
        }
        // Amendment introduction language
        if (text.match(/\b(?:introduce|introducing|offered?|offering)\s+(?:an\s+)?amendment\s+(?:to|which|that)\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains amendment introduction');
        }
        // Demanding/calling for action
        if (text.match(/\b(?:demanding|calling\s+(?:for|on)|urging)\s+(?:[A-Z][\w\s]+\s+)?(?:to|for|answers)/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains demand/call for action');
        }
        // Leadership title patterns
        if (text.match(/\b(?:Leader|Whip|Chair|Ranking\s+Member|Chairwoman|Chairman)\s+[A-Z][a-z]+/)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains leadership title');
        }
        // Companion legislation references
        if (text.match(/\bcompanion\s+(?:legislation|bill)\s+in\s+the\s+(?:house|senate)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains companion legislation reference');
        }
        // Stakeholder/organization quotes (non-politician)
        if (text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+\s+\([^)]+(?:Association|Coalition|Union|Organization|Foundation|Institute|Alliance|Council|Federation)\)/)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains stakeholder organization quote');
        }
        // Bill reintroduction language
        if (text.match(/\b(?:reintroduce[sd]?|reintroducing|relaunching)\s+(?:his|her|their|the)\s+(?:landmark|updated|revised)?\s*(?:bill|legislation|proposal|act)\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains bill reintroduction');
        }
        // Organizational support language
        if (text.match(/\b(?:supported\s+by|endorsed\s+by)\s+(?:numerous|several|many|multiple)?\s*(?:organizations|groups|advocates)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains organizational support');
        }
        // Event participant language
        if (text.match(/\b(?:was\s+joined\s+by|joined\s+by|accompanied\s+by)\s+(?:local|state|federal|community)?\s*(?:leaders?|officials?|representatives?)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains event participant language');
        }
        // Advocacy/warning language
        if (text.match(/\b(?:warn|warned|warning)\s+(?:against|about|of)|(?:call|called|calling)\s+out\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains advocacy/warning language');
        }

        // MEDIA_ADVISORY indicators
        if (text.match(/MEDIA\s+ADVISOR/i)) {
            scores.MEDIA_ADVISORY += 10;
            indicators.push('Title contains "MEDIA ADVISORY"');
        }
        if (text.match(/(?:WHO|WHAT|WHEN|WHERE|WHY):/gi)) {
            const whCount = (text.match(/(?:WHO|WHAT|WHEN|WHERE|WHY):/gi) || []).length;
            scores.MEDIA_ADVISORY += whCount * 2;
            indicators.push(`Contains ${whCount} WH-question headers`);
        }
        if (text.match(/(?:VISUALS|LIVESTREAM|RSVP):/i)) {
            scores.MEDIA_ADVISORY += 3;
            indicators.push('Contains event logistics markers');
        }

        // LETTER indicators
        if (text.match(/^Dear\s+(?:Mr\.|Ms\.|Mrs\.|Dr\.|Senator|Representative|Governor)/im)) {
            scores.LETTER += 10;
            indicators.push('Starts with "Dear" salutation');
        }
        if (text.match(/Sincerely,?\s*\n\s*\n\s*[A-Z]/i)) {
            scores.LETTER += 5;
            indicators.push('Contains "Sincerely" closing');
        }

        // TRANSCRIPT indicators
        if (text.match(/^(?:SPEAKER|MODERATOR|Q:|A:)/im)) {
            scores.TRANSCRIPT += 10;
            indicators.push('Contains speaker/Q&A labels');
        }
        if (text.match(/\[(?:APPLAUSE|LAUGHTER|CROSSTALK)\]/i)) {
            scores.TRANSCRIPT += 5;
            indicators.push('Contains transcript annotations');
        }

        // FACT_SHEET indicators
        if (text.match(/FACT\s+SHEET/i)) {
            scores.FACT_SHEET += 10;
            indicators.push('Title contains "FACT SHEET"');
        }
        const bulletCount = (text.match(/^\s*[•·●∙◦▪▫-]\s+/gm) || []).length;
        if (bulletCount >= 5) {
            scores.FACT_SHEET += bulletCount;
            indicators.push(`Contains ${bulletCount} bullet points`);
        }

        // Determine winning type
        let maxScore = 0;
        let detectedType = 'UNKNOWN';
        for (const [type, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                detectedType = type;
            }
        }

        // Determine confidence based on score
        let confidence = 'none';
        if (maxScore >= 10) {
            confidence = 'high';
        } else if (maxScore >= 5) {
            confidence = 'medium';
        } else if (maxScore > 0) {
            confidence = 'low';
        }

        return {
            type: detectedType,
            confidence: confidence,
            score: maxScore,
            indicators: indicators,
            all_scores: scores
        };
    }

    /**
     * Detect press release subtypes using pattern matching
     * Based on training from real press releases
     * Returns array of detected subtypes with confidence scores
     * @param {string} text - The press release text
     * @param {string} releaseType - The detected release type (STATEMENT, NEWS_RELEASE, etc.)
     */
    detectSubtypes(text, releaseType = 'UNKNOWN') {
        const detected = [];
        const textLower = text.toLowerCase();

        // STATEMENT-specific subtypes
        if (releaseType === 'STATEMENT') {
            // Response to events/opposition
            if (textLower.match(/\b(?:responds?\s+to|in\s+response\s+to|reacts?\s+to)/i)) {
                detected.push({ subtype: 'response_statement', confidence: 'high', keywords: ['responds to', 'in response to'] });
            }
            // Opposition/condemnation
            if (textLower.match(/\b(?:condemns?|denounces?|opposes?|rejects?)/i)) {
                detected.push({ subtype: 'condemnation', confidence: 'high', keywords: ['condemns', 'denounces', 'opposes'] });
            }
            // Support/praise
            if (textLower.match(/\b(?:praises?|applauds?|commends?|supports?|celebrates?)/i)) {
                detected.push({ subtype: 'support_statement', confidence: 'high', keywords: ['praises', 'supports', 'commends'] });
            }
            // Policy position
            if (textLower.match(/\b(?:position\s+on|stance\s+on|believes?|calls?\s+for)/i)) {
                detected.push({ subtype: 'policy_position', confidence: 'medium', keywords: ['position on', 'calls for'] });
            }
        }

        // NEWS_RELEASE and FACT_SHEET-specific subtypes (including attack subtypes)
        if (releaseType === 'NEWS_RELEASE' || releaseType === 'FACT_SHEET') {
            // Campaign announcement
            if (textLower.match(/\b(?:announced?\s+(?:his|her|their)\s+candidacy|launches?\s+campaign|running\s+for|campaign\s+for\s+(?:governor|senate|congress|president))/i)) {
                detected.push({ subtype: 'campaign_announcement', confidence: 'high', keywords: ['announced candidacy', 'launches campaign', 'running for'] });
            }

            // Endorsement
            if (textLower.match(/\b(?:endorses?|endorsement|announced?\s+(?:his|her|their)\s+endorsement|support\s+(?:in\s+this\s+race|for\s+[A-Z]))/i)) {
                detected.push({ subtype: 'endorsement', confidence: 'high', keywords: ['endorses', 'endorsement', 'support in this race'] });
            }

            // Response to opposition (includes calls/challenges to opponent)
            if (textLower.match(/\b(?:responds?\s+to|criticizes?|slams?|calls?\s+out|hits?\s+back|refuses?\s+to\s+stand\s+up|while\s+[A-Z][a-z]+\s+(?:rips?|refuses?|does))/i)) {
                detected.push({ subtype: 'response_opposition', confidence: 'high', keywords: ['responds to', 'criticizes', 'refuses to stand up'] });
            }
            // Calls/challenges to opponent to take action
            if (textLower.match(/\bcalls?\s+on\s+\w+\s+to\b|\bwhat(?:'?s|\s+is)\s+\w+\s+hiding\b|\brefused?\s+to\s+(?:release|disclose|answer|provide)/i)) {
                if (!detected.find(d => d.subtype === 'response_opposition')) {
                    detected.push({ subtype: 'response_opposition', confidence: 'high', keywords: ['calls on', 'hiding', 'refused to release'] });
                }
            }
            // Additional opposition patterns
            if (textLower.match(/\b(?:attacks?|challenges?|condemns?|opposes?|denounces?|blasts?)/i) &&
                textLower.match(/\b(?:Trump|Republicans?|Democrats?|opponent)/i)) {
                if (!detected.find(d => d.subtype === 'response_opposition')) {
                    detected.push({ subtype: 'response_opposition', confidence: 'medium', keywords: ['attacks', 'condemns', 'opposes'] });
                }
            }

            // Policy announcement
            if (textLower.match(/\b(?:introduces?|legislation|bill|act|proposes?|unveils?)\s+(?:the|new|a)\s+[A-Z]/i)) {
                detected.push({ subtype: 'policy_announcement', confidence: 'high', keywords: ['introduces', 'legislation', 'bill', 'act'] });
            }

            // Legislative action (includes bill passage, hearings, floor actions)
            if (textLower.match(/\b(?:hearing|questioned?\s+witnesses?|(?:senate|house)\s+floor|press\s+conference|speech|testimony|questions?|(?:subcommittee|committee|congress)\s+(?:passed|advances?)|reauthorizes?|(?:move|moved)\s+to\s+(?:the\s+)?(?:full\s+)?(?:committee|floor|vote))/i)) {
                detected.push({ subtype: 'legislative_action', confidence: 'medium', keywords: ['hearing', 'committee passed', 'reauthorizes', 'floor speech'] });
            }

            // Letter/press campaign (sending letters, seeking answers)
            if (textLower.match(/\b(?:pressed?|sent\s+(?:a\s+)?letter|wrote\s+(?:to|a\s+letter)|seek(?:s|ing)?\s+answers?|demand(?:s|ing)?\s+(?:answers?|transparency))\b/i)) {
                detected.push({ subtype: 'legislative_action', confidence: 'medium', keywords: ['pressed', 'sent letter', 'seek answers'] });
            }

            // Funding announcement
            if (textLower.match(/\b(?:secures?|announces?\s+(?:\$|funding)|grants?|federal\s+funding|awards?)\s+(?:\$[\d,]+|\d+\s+million)/i)) {
                detected.push({ subtype: 'funding_announcement', confidence: 'high', keywords: ['secures funding', 'federal funding', 'grants'] });
            }

            // Personnel announcement
            if (textLower.match(/\b(?:appoints?|announces?\s+appointment|names?|hires?|joins?\s+(?:campaign|team))/i)) {
                detected.push({ subtype: 'personnel_announcement', confidence: 'medium', keywords: ['appoints', 'names', 'joins campaign'] });
            }

            // Poll/survey results
            if (textLower.match(/\b(?:poll|survey|shows?\s+lead|momentum)/i)) {
                detected.push({ subtype: 'poll_results', confidence: 'medium', keywords: ['poll', 'survey', 'lead'] });
            }

            // ATTACK SUBTYPES (based on attack_tagger.py patterns)

            // Policy-based attack (voting record, legislative actions, policy positions)
            if (textLower.match(/\bvoted?\s+(?:against|to|for)\b|\bwould\s+(?:ban|defund|cut|raise|eliminate|gut)\b|\b(?:cutting|firing|gutting|slashing|eliminating)\b|\b(?:on|their|his|her)\s+(?:plan|policy|record|bill|agenda)\b|\bfunding\s+cuts?|\bbudget\s+(?:betrayal|cuts?|deal)|\brig(?:ged|ging)?\s+(?:the|congressional|election)|\battacking?\s+(?:benefits?|rights?|services?)/i)) {
                detected.push({ subtype: 'attack_policy', confidence: 'high', keywords: ['voted against', 'their record', 'funding cuts', 'budget betrayal', 'rig', 'attacking benefits'] });
            }

            // Character attack
            if (textLower.match(/\blie(?:d|s|ing)\b|\bdishonest\b|\bcann?ot be trusted\b|\bresum[eé]\b|\bscandal\b/i)) {
                detected.push({ subtype: 'attack_character', confidence: 'high', keywords: ['lie', 'dishonest', 'cannot be trusted', 'scandal'] });
            }

            // Competence/effectiveness attack
            if (textLower.match(/\bfailed?\s+(?:to|on)\b|\bunfit\b|\bnot\s+(?:ready|qualified)\b|\b(?:incompetent|ineffective|weak|squirming)\b|\brefuses?\s+to\s+(?:stand|fight|act|lead)\b/i)) {
                detected.push({ subtype: 'attack_competence', confidence: 'high', keywords: ['failed to', 'unfit', 'refuses to stand', 'ineffective'] });
            }

            // Values/identity attack
            if (textLower.match(/\b(?:out of step|does(?:n'?|\s+no)t share our values)\b|\b(?:extreme|radical)\b|\banti-(?:family|freedom|faith|choice)\b/i)) {
                detected.push({ subtype: 'attack_values', confidence: 'high', keywords: ['extreme', 'radical', 'out of step', 'anti-'] });
            }

            // Association attack (connect opponent to unpopular figures/groups)
            if (textLower.match(/\b(?:tied|linked|aligned)\s+(?:to|with)\b|\bfunded by\b|\b(?:backed|bankrolled)\s+by\b|\b(?:lobby|special interests?|dark money)\b|\b(?:trump|maga)\s+(?:and|'s|agenda|allies|republicans?)\b|\b(?:scheme|plot)\b|\b(?:betrayal|deal)\b|\bin\s+bed\s+with|\bdoing\s+the\s+bidding\s+of|\bserves?\s+\w+\s+not\s+\w+/i)) {
                detected.push({ subtype: 'attack_association', confidence: 'high', keywords: ['tied to', 'funded by', 'special interests', 'Trump', 'MAGA', 'scheme', 'betrayal'] });
            }

            // Hypocrisy attack
            if (textLower.match(/\b(?:hypocrisy|hypocrite|double standard)\b|\bsays\s+.*\s+but\s+(?:votes|voted|does|did)\b|\b(?:then|yet)\s+(?:voted|did)\b/i)) {
                detected.push({ subtype: 'attack_hypocrisy', confidence: 'high', keywords: ['hypocrisy', 'double standard', 'says...but'] });
            }

            // Ethics/corruption attack
            if (textLower.match(/\b(?:illegal|unlawful|ethics|corrupt(?:ion)?|pay[- ]?to[- ]?play|quid pro quo)\b|\bconflict of interest\b/i)) {
                detected.push({ subtype: 'attack_ethics', confidence: 'high', keywords: ['corruption', 'illegal', 'ethics', 'conflict of interest'] });
            }

            // Fear/risk attack (emphasize harm, loss, consequences)
            if (textLower.match(/\b(?:danger(?:ous)?|threat(?:en)?(?:s|ing|ed)?|risk(?:s|ing|ed)?|endanger(?:s|ing|ed)?|attack(?:s|ing|ed)?\s+on\s+(?:democracy|freedom|rights))\b|\bputs?\s+(?:at\s+)?risk|\bforced?\s+to\s+(?:close|shut\s+down|go\s+without)|\bcut\s+back\s+(?:services|care|benefits)|\b(?:severe|critical|dangerous)\s+shortages?|\bdelayed?\s+(?:payments?|checks?|benefits?)|\bdisenfranchis(?:e|ing|ed)|\bscrew(?:s|ing|ed)?\s+(?:over|the)|\b(?:will|would|could|may)\s+suffer|\bat\s+the\s+expense\s+of/i)) {
                detected.push({ subtype: 'attack_fear', confidence: 'high', keywords: ['danger', 'threat', 'risk', 'forced to close', 'severe shortages', 'delayed payments', 'disenfranchise', 'suffer'] });
            }

            // Contrast attack
            if (textLower.match(/\bwhile\s+(?:they|opponent)\s+.*\s+(?:we|our\s+(?:campaign|plan))\b|\bthe(?:m|ir)\s+vs\.?\s+us\b|\bby the numbers\b|\b(?:in contrast|whereas)\b/i)) {
                detected.push({ subtype: 'attack_contrast', confidence: 'medium', keywords: ['while they', 'them vs us', 'in contrast'] });
            }

            // Rapid response/counterattack (support more phrasings)
            if (textLower.match(/\b(?:in response to|on the heels of|minutes after|following|after)\s+(?:last night'?s|the|their|his|her)\b|\b(?:claim|charge|attack)\s+is\s+(?:false|misleading|a lie)\b|\b(?:correct the record|fact check(?:ed)?|set the record straight)\b/i)) {
                detected.push({ subtype: 'attack_rapid_response', confidence: 'high', keywords: ['in response to', 'on the heels of', 'false claim', 'correct the record'] });
            }
        }

        // MEDIA_ADVISORY-specific subtypes
        if (releaseType === 'MEDIA_ADVISORY') {
            if (textLower.match(/\b(?:press\s+conference|news\s+conference)/i)) {
                detected.push({ subtype: 'press_conference', confidence: 'high', keywords: ['press conference'] });
            }
            if (textLower.match(/\b(?:photo\s+op|photo\s+opportunity|visual)/i)) {
                detected.push({ subtype: 'photo_opportunity', confidence: 'high', keywords: ['photo op', 'visual'] });
            }
            if (textLower.match(/\b(?:interview|availability|media\s+availability)/i)) {
                detected.push({ subtype: 'interview_availability', confidence: 'high', keywords: ['interview', 'availability'] });
            }
            if (textLower.match(/\b(?:event|rally|town\s+hall)/i)) {
                detected.push({ subtype: 'event_announcement', confidence: 'medium', keywords: ['event', 'rally', 'town hall'] });
            }
        }

        // LETTER-specific subtypes
        if (releaseType === 'LETTER') {
            if (textLower.match(/\b(?:calls?\s+for|urges?|demands?)/i)) {
                detected.push({ subtype: 'call_to_action', confidence: 'high', keywords: ['calls for', 'urges', 'demands'] });
            }
            if (textLower.match(/\b(?:inquiry|investigation|concerns?)/i)) {
                detected.push({ subtype: 'inquiry_letter', confidence: 'medium', keywords: ['inquiry', 'investigation'] });
            }
        }

        // TRANSCRIPT-specific subtypes
        if (releaseType === 'TRANSCRIPT') {
            if (textLower.match(/\b(?:debate|forum)/i)) {
                detected.push({ subtype: 'debate_transcript', confidence: 'high', keywords: ['debate', 'forum'] });
            }
            if (textLower.match(/\b(?:interview|q&a|questions?\s+and\s+answers?)/i)) {
                detected.push({ subtype: 'interview_transcript', confidence: 'high', keywords: ['interview', 'Q&A'] });
            }
            if (textLower.match(/\b(?:speech|remarks?|address)/i)) {
                detected.push({ subtype: 'speech_transcript', confidence: 'high', keywords: ['speech', 'remarks', 'address'] });
            }
        }

        return detected.length > 0 ? detected : [{ subtype: 'general', confidence: 'low', keywords: [] }];
    }

    /**
     * Detect issues/topics from press release content
     * Based on training from real press releases
     * Returns array of detected issues with confidence scores
     */
    detectIssues(text) {
        const detected = [];
        const textLower = text.toLowerCase();

        // HEALTHCARE
        if (textLower.match(/\b(?:health\s*care|healthcare|medical|coverage|affordable\s+care\s+act|medicaid|medicare|insurance|hospital)/i)) {
            detected.push({ issue: 'healthcare', confidence: 'high' });
        }

        // INFRASTRUCTURE
        if (textLower.match(/\b(?:infrastructure|gateway|transit|roads?|bridges?|transportation|rail)/i)) {
            detected.push({ issue: 'infrastructure', confidence: 'high' });
        }

        // ISRAEL/PALESTINE
        if (textLower.match(/\b(?:israel|gaza|palestine|israeli\s+government|block\s+the\s+bombs|middle\s+east|hostages)/i)) {
            detected.push({ issue: 'israel_palestine', confidence: 'high' });
        }

        // CRYPTOCURRENCY
        if (textLower.match(/\b(?:crypto|bitcoin|cryptocurrency|digital\s+assets?|blockchain)/i)) {
            detected.push({ issue: 'cryptocurrency', confidence: 'high' });
        }

        // GOVERNMENT SHUTDOWN
        if (textLower.match(/\b(?:government\s+shutdown|shutdown|keep\s+the\s+government\s+open)/i)) {
            detected.push({ issue: 'government_shutdown', confidence: 'high' });
        }

        // TAXES
        if (textLower.match(/\b(?:tax(?:es|ation)?|IRS|tax\s+(?:cuts?|reform|code|policy))/i)) {
            detected.push({ issue: 'taxes', confidence: 'high' });
        }

        // ELECTIONS
        if (textLower.match(/\b(?:election|campaign|voter|ballot|poll|primary|general\s+election)/i)) {
            detected.push({ issue: 'elections', confidence: 'medium' });
        }

        // CIVIL RIGHTS
        if (textLower.match(/\b(?:civil\s+rights\s+act|discrimination|segregation|voting\s+rights|equality)/i)) {
            detected.push({ issue: 'civil_rights', confidence: 'high' });
        }

        // FREE SPEECH
        if (textLower.match(/\b(?:free\s+speech|first\s+amendment|censorship)/i)) {
            detected.push({ issue: 'free_speech', confidence: 'high' });
        }

        // POLITICAL VIOLENCE
        if (textLower.match(/\b(?:political\s+violence|assassination|murder|killing|attack)/i)) {
            detected.push({ issue: 'political_violence', confidence: 'high' });
        }

        // FOREIGN POLICY (general)
        if (textLower.match(/\b(?:foreign\s+policy|international|diplomatic|ambassador|state\s+department)/i)) {
            detected.push({ issue: 'foreign_policy', confidence: 'medium' });
        }

        // EDUCATION
        if (textLower.match(/\b(?:education|school|student|teacher|university|college)/i)) {
            detected.push({ issue: 'education', confidence: 'medium' });
        }

        // CLIMATE
        if (textLower.match(/\b(?:climate|environment|clean\s+energy|renewable|carbon|emissions)/i)) {
            detected.push({ issue: 'climate', confidence: 'medium' });
        }

        // IMMIGRATION
        if (textLower.match(/\b(?:immigration|immigrant|border|DACA|asylum|deportation)/i)) {
            detected.push({ issue: 'immigration', confidence: 'high' });
        }

        // ECONOMY
        if (textLower.match(/\b(?:economy|economic|jobs|employment|unemployment|inflation|recession)/i)) {
            detected.push({ issue: 'economy', confidence: 'medium' });
        }

        // HOUSING
        if (textLower.match(/\b(?:housing|affordable\s+housing|homelessness|rent)/i)) {
            detected.push({ issue: 'housing', confidence: 'high' });
        }

        // CRIMINAL JUSTICE
        if (textLower.match(/\b(?:criminal\s+justice|police|law\s+enforcement|incarceration|prison)/i)) {
            detected.push({ issue: 'criminal_justice', confidence: 'medium' });
        }

        // GUN CONTROL
        if (textLower.match(/\b(?:gun|firearm|second\s+amendment|shooting|NRA)/i)) {
            detected.push({ issue: 'gun_control', confidence: 'high' });
        }

        // ABORTION
        if (textLower.match(/\b(?:abortion|reproductive|Roe\s+v\.?\s+Wade|pro-choice|pro-life)/i)) {
            detected.push({ issue: 'abortion', confidence: 'high' });
        }

        // SOCIAL SECURITY
        if (textLower.match(/\b(?:social\s+security|retirement\s+age|retirees|seniors|medicare\s+and\s+social\s+security)/i)) {
            detected.push({ issue: 'social_security', confidence: 'high' });
        }

        // VETERANS
        if (textLower.match(/\b(?:veteran|veterans|VA|department\s+of\s+veterans\s+affairs|military\s+service|service\s+members)/i)) {
            detected.push({ issue: 'veterans', confidence: 'high' });
        }

        // DISASTER RECOVERY / EMERGENCY MANAGEMENT
        if (textLower.match(/\b(?:hurricane|disaster|emergency|recovery|FEMA|flooding|wildfire|storm|damage|rebuild|relief)/i)) {
            detected.push({ issue: 'disaster_recovery', confidence: 'high' });
        }

        // TRUMP/OPPONENT RECORD
        if (textLower.match(/\b(?:Trump|opponent)\b/i) &&
            textLower.match(/\b(?:record|administration|policies|actions|failed|refuses)/i)) {
            detected.push({ issue: 'opponent_record', confidence: 'medium' });
        }

        return detected.length > 0 ? detected : [{ issue: 'general', confidence: 'low' }];
    }
}

// Export for use in other modules
module.exports = new PressReleaseTypeClassifier();

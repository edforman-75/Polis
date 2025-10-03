# SEO and AIO Optimization System

## Overview

The system provides dual optimization for campaign press releases:
- **SEO (Search Engine Optimization)**: Traditional search engines (Google, Bing)
- **AIO (AI Optimization)**: AI-powered search (ChatGPT, Perplexity, Claude, Google AI Overview)

## Philosophy

**Keep prose readable for humans, put technical data in structured formats.**

- URLs, citations, and fact-checking sources belong in JSON-LD, not prose
- Strategic links (CTAs, campaign pages) belong in prose
- Prose should be compelling and readable for journalists and voters
- Structured data (JSON-LD) provides machine-readable facts for AI systems

## Architecture

```
Press Release Text
       ↓
    Parser
       ↓
JSON-LD Generator → SEO Meta Tags + Structured Data
       ↓
SEO/AIO Analyzer → Scores + Recommendations
       ↓
Publication-ready HTML with embedded optimization
```

## SEO Scoring System (0-100)

### What We Check

#### 1. Headline Quality (10 points)
```javascript
// Optimal: 50-70 characters
if (headline.length < 30) {
    score -= 5;  // Too short, lacks detail
    severity: 'warning'
}
if (headline.length > 70) {
    score -= 3;  // Too long, truncated in search results
    severity: 'info'
}

// Action words boost engagement
if (!/(announces|launches|unveils|releases|introduces)/i.test(headline)) {
    severity: 'info'
    recommendation: "Consider adding action words"
}
```

**Example:**
- ❌ "Jobs" (too short, vague)
- ❌ "NEW DATA: U.S. Businesses Shed Jobs as Virginians Face Economic Uncertainty" (75 chars, too long)
- ✅ "32,000 Jobs Lost: Virginia Needs New Economic Leadership" (58 chars)

#### 2. Content Length (15 points)
```javascript
const wordCount = content.split(/\s+/).length;

if (wordCount < 300) {
    score -= 10;
    severity: 'warning'
    // Search engines favor 300+ word content
}
if (wordCount > 1500) {
    score -= 5;
    severity: 'info'
    // May be too long for press release format
}
```

**Optimal:** 400-800 words for press releases

#### 3. Structured Data Completeness (20 points)
```javascript
// Required fields
if (!jsonld['@id']) {
    score -= 10;  // Missing canonical URL
}
if (!jsonld.datePublished) {
    score -= 5;
}
if (!jsonld.author || !jsonld.author['@type']) {
    score -= 5;  // Missing author entity
}
```

#### 4. Meta Description (10 points)
```javascript
// Auto-generated from first 150-160 characters
const description = extractMetaDescription(content);

if (description.length < 120) {
    score -= 5;
    // Too short, wasted SERP real estate
}
if (description.length > 160) {
    score -= 3;
    // Will be truncated in search results
}
```

#### 5. Keyword Optimization (15 points)
```javascript
// Based on cpo:issueArea (e.g., "healthcare", "economy", "taxes")
const issueArea = jsonld['cpo:issueArea'];
const keyword = issueArea.replace(/_/g, ' ');

const keywordDensity = (content.toLowerCase()
    .match(new RegExp(keyword, 'g')) || []).length;

// Optimal: 2-5 mentions for 300-500 word content
if (keywordDensity < 2) {
    score -= 5;
    recommendation: `Mention "${keyword}" 2-3 times naturally`
}
if (keywordDensity > 8) {
    score -= 3;
    // Keyword stuffing penalty
}
```

#### 6. Call-to-Action (10 points)
```javascript
const hasCTA = /\b(visit|donate|volunteer|join|learn more|rsvp|sign up)\b/i.test(content);

if (!hasCTA) {
    score -= 10;
    severity: 'warning'
    // CTAs improve engagement signals (click-through rate)
}
```

#### 7. Internal/External Links (10 points)
```javascript
// Strategic links to campaign content
const hasStrategicLinks = content.includes('http') || jsonld['cpo:cta'];

if (!hasStrategicLinks) {
    score -= 5;
    severity: 'info'
}
```

#### 8. Mobile-Friendly Formatting (5 points)
- Short paragraphs (2-4 sentences)
- Scannable structure
- No wide tables or large images

#### 9. Social Media Optimization (5 points)
```javascript
// Open Graph and Twitter Card tags
if (!metaTags.includes('og:title')) {
    score -= 3;
}
if (!metaTags.includes('og:description')) {
    score -= 2;
}
```

### SEO Grade Scale
- **A (90-100)**: Excellent - Highly optimized
- **B (80-89)**: Good - Minor improvements possible
- **C (70-79)**: Fair - Significant improvements recommended
- **D (60-69)**: Poor - Major optimization needed
- **F (0-59)**: Failing - Critical issues present

---

## AIO Scoring System (0-100)

### What We Check

#### 1. Structured Claims with Evidence (30 points)
**Most critical for AI fact-checking**

```javascript
if (!jsonld['cpo:claims'] || jsonld['cpo:claims'].length === 0) {
    score -= 20;
    severity: 'critical'
}

// Example structured claim:
{
  "@type": "ClaimReview",
  "cpo:claimText": "U.S. private sector businesses lost 32,000 workers in September 2025",
  "cpo:evidence": "https://adpemploymentreport.com/2025/September/National-Employment-Report",
  "cpo:verificationStatus": "TRUE",
  "cpo:confidence": 0.95
}
```

**Why this matters:**
- AI systems can verify claims against evidence URLs
- Builds trust and authority for AI-generated answers
- Enables fact-checking and citation in AI responses

**Prose stays clean:**
```
The ADP National Employment Report released today shows U.S. private
sector businesses lost 32,000 workers in September...
```

**JSON-LD provides verification:**
```json
"cpo:claims": [
  {
    "cpo:claimText": "...",
    "cpo:evidence": "https://adpemploymentreport.com/..."
  }
]
```

#### 2. Entity Definitions (15 points)
```javascript
if (!jsonld.author || !jsonld.author['@type']) {
    score -= 10;
    // AI needs to understand WHO is making claims
}

// Well-defined entity:
{
  "@type": "Organization",
  "name": "Abigail Spanberger for Governor",
  "url": "https://spanbergerforvirginia.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "press",
    "email": "press@spanbergerforvirginia.com"
  }
}
```

#### 3. Contextual Information (10 points)
```javascript
// Background, definitions, explanations
const hasBackground = /\b(background|context|previously|history)\b/i.test(content);

if (!hasBackground) {
    score -= 5;
    recommendation: "Add background section for context"
}
```

**Example:**
```
Background:

Spanberger announced her "Growing Virginia Plan" focused on protecting
jobs and growing the economy. A UVA forecast projects virtually no job
growth in Virginia for 2026.
```

#### 4. Quantitative Data (15 points)
```javascript
// Numbers, percentages, statistics
const numberCount = (content.match(/\b\d+(,\d{3})*(\.\d+)?%?\b/g) || []).length;

if (numberCount < 3) {
    score -= 10;
    severity: 'warning'
    // AI systems prioritize factual, data-driven content
}
if (numberCount >= 5) {
    // Bonus for data-rich content
}
```

**Example - Data-Rich Content:**
```
✅ 32,000 workers lost
✅ Seven consecutive months of rising unemployment
✅ 2.8% to 3.4% unemployment increase
✅ 2020 and 2022 Chamber endorsements
✅ Zero job growth forecast for 2026
```

#### 5. Source Attribution (10 points)
```javascript
// In JSON-LD, not prose
const hasSourceAttribution = jsonld['cpo:claims']?.some(claim => claim['cpo:evidence']);

if (!hasSourceAttribution) {
    score -= 10;
    severity: 'warning'
    recommendation: "Add evidence URLs to cpo:claims"
}
```

#### 6. Q&A Format (10 points)
```javascript
// FAQ sections help AI extract answers
const hasQA = /\bQ:|Question:|A:|Answer:/i.test(content);

if (!hasQA) {
    score -= 5;
    severity: 'info'
    recommendation: "Consider adding FAQ section"
}
```

**Example Q&A Section:**
```
Q: What is causing Virginia's economic challenges?

A: Virginia is facing a perfect storm of federal policy uncertainty,
including disruptive tariff changes and budget cuts from the Trump
Administration's DOGE initiative.

Q: How would Spanberger's plan create jobs?

A: The Growing Virginia Plan focuses on three areas: attracting new
businesses through competitive incentives, supporting existing small
businesses with reduced red tape, and investing in workforce training.
```

#### 7. Semantic Clarity (10 points)
```javascript
// Clear, unambiguous language
// Avoid jargon without definition
// Use active voice

const hasPassiveVoice = /(was|were|been|being)\s+\w+ed/g.test(content);
if (passiveCount > wordCount * 0.15) {
    score -= 5;
    recommendation: "Use more active voice for clarity"
}
```

### AIO Grade Scale
Same as SEO: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)

---

## Recommendation Engine

### Severity Levels

```javascript
const SEVERITY = {
    CRITICAL: 'critical',  // Must fix before publication
    ERROR: 'error',        // Strongly recommended to fix
    WARNING: 'warning',    // Should fix for better performance
    INFO: 'info'          // Optional optimization
};
```

### How Recommendations Are Generated

#### 1. Issue Detection
```javascript
analyze(content, jsonld, parseResult) {
    const issues = [];

    // Detect each issue
    if (wordCount < 300) {
        issues.push({
            category: 'SEO',
            severity: 'warning',
            issue: 'Content too short (183 words)',
            recommendation: 'Aim for 300-800 words for better ranking potential',
            impact: 'Search engines favor longer, comprehensive content',
            quickFix: false
        });
    }

    return issues;
}
```

#### 2. Prioritization
Issues are sorted by:
1. Severity (critical → error → warning → info)
2. Category (Critical AIO issues before SEO tips)
3. Impact on score

#### 3. Actionable Recommendations

**Bad Recommendation (vague):**
```
❌ "Improve your headline"
```

**Good Recommendation (specific):**
```
✅ Headline too long (75 chars, optimal is 50-70)
   → Shorten headline for better SERP display

   Current: "NEW DATA: U.S. Businesses Shed Jobs as Virginians Face Economic Uncertainty"
   Suggested: "32,000 Jobs Lost: Virginia Needs New Economic Leadership" (58 chars)
```

#### 4. Prose-Focused Recommendations

**We recommend prose improvements, not JSON-LD clutter:**

❌ **DON'T recommend:**
```
"Add source URLs to your press release"
```

✅ **DO recommend:**
```
[CRITICAL] Add structured claims with evidence
→ Add cpo:claims array with factual claims and evidence sources for AI fact-checking

Implementation: Add to JSON-LD (not prose):
{
  "cpo:claims": [
    {
      "@type": "ClaimReview",
      "cpo:claimText": "U.S. private sector businesses lost 32,000 workers",
      "cpo:evidence": "https://adpemploymentreport.com/..."
    }
  ]
}

Your prose stays clean and readable.
```

---

## Real-World Example: Spanberger Release

### Input
```
NEW DATA: U.S. Businesses Shed Jobs as Virginians Face Economic Uncertainty

Oct 02, 2025

The ADP National Employment Report released today shows U.S. private sector
businesses lost 32,000 workers in September, highlighting growing economic
uncertainty facing Virginia families and businesses.

Virginia recently lost its CNBC ranking as "America's Top State for Business,"
and the unemployment rate in Virginia has risen for seven consecutive months.

Connor Joseph, Communications Director, stated: "Amid the Trump Administration's
DOGE attacks, tariff policies, and tax law driving up costs for Virginia families
and causing chaos for businesses, the economic data is clear: Virginia needs a
governor focused on protecting jobs and growing our economy."

Background:

Spanberger announced her "Growing Virginia Plan" focused on protecting jobs and
growing the economy. A UVA forecast projects virtually no job growth in Virginia
for 2026.

Spanberger was previously endorsed by the U.S. Chamber of Commerce in 2020 and
2022 for supporting businesses and economic growth during her time in Congress.

The latest employment data underscores the economic challenges facing Virginia
and the need for leadership focused on job creation and business support.
```

### Analysis Results

**Scores:**
- SEO: 79/100 (C)
- AIO: 70/100 (C)
- Overall: 75/100 (C)

**Status:** Ready to Publish (with improvements recommended)

### Issues Found

#### 🚨 Critical Issues
```
1. No structured claims with evidence
   Category: AIO
   Impact: -20 points

   Recommendation:
   Add cpo:claims array with factual claims and evidence sources for AI fact-checking

   Implementation:
   {
     "cpo:claims": [
       {
         "@type": "ClaimReview",
         "cpo:claimText": "U.S. private sector businesses lost 32,000 workers in September 2025",
         "cpo:evidence": "https://adpemploymentreport.com/2025/September/National-Employment-Report",
         "cpo:verificationStatus": "TRUE",
         "cpo:confidence": 0.95
       }
     ]
   }
```

#### ⚠️ Warnings
```
2. Content too short (183 words)
   Category: SEO
   Impact: -10 points

   Recommendation:
   Aim for 300-800 words for better ranking potential

   Quick Wins:
   - Expand "Growing Virginia Plan" details (add 2-3 pillars)
   - Add human impact paragraph ("For Virginia families, these aren't just statistics...")
   - Add FAQ section (2 Q&As about the economic situation and Spanberger's plan)

   Expected gain: +10 SEO points

3. Missing call-to-action
   Category: SEO
   Impact: -10 points

   Recommendation:
   Add CTA to improve engagement signals and conversions

   Suggested additions:
   - "Learn more about Spanberger's Growing Virginia Plan at [URL]"
   - "Join our campaign to put jobs first: [donate/volunteer link]"

   Expected gain: +10 SEO points

4. No source attribution detected
   Category: AIO
   Impact: -10 points

   Recommendation:
   Add sources or citations for AI to verify claims and build trust

   Implementation (in JSON-LD):
   - ADP Employment Report URL
   - CNBC rankings URL
   - UVA forecast URL
   - Chamber of Commerce endorsement URLs

   Expected gain: +10 AIO points
```

#### 💡 Optimization Tips
```
5. Headline too long (75 chars)
   Category: SEO
   Impact: -3 points

   Current: "NEW DATA: U.S. Businesses Shed Jobs as Virginians Face Economic Uncertainty"

   Suggested:
   - "32,000 Jobs Lost: Virginia Needs New Economic Leadership" (58 chars)
   - "Job Losses Mount as Virginia Families Face Uncertainty" (56 chars)

   Expected gain: +3 SEO points

6. Low keyword density for "taxes"
   Category: SEO
   Impact: -3 points

   Issue: cpo:issueArea is "taxes" but the word appears 0 times

   Recommendation:
   Mention "taxes" 2-3 times naturally throughout the content

   Example revision:
   Current: "...tax law driving up costs for Virginia families..."
   Better: "...tax policies driving up costs for Virginia families and
            forcing businesses to make difficult decisions about taxes,
            payroll, and growth..."

   Expected gain: +3 SEO points

7. No Q&A format detected
   Category: AIO
   Impact: -5 points

   Recommendation:
   Consider adding FAQ-style content to improve AI answer extraction

   Suggested Q&As:

   Q: What is causing Virginia's economic challenges?
   A: Virginia is facing a perfect storm of federal policy uncertainty, including
      disruptive tariff changes and budget cuts from the Trump Administration's
      DOGE initiative.

   Q: How would Spanberger's plan create jobs?
   A: The Growing Virginia Plan focuses on three areas: attracting new businesses,
      supporting small businesses, and investing in workforce training.

   Expected gain: +5 AIO points
```

### Projected Improvement

**If all recommendations implemented:**
- SEO: 79 → 92 (+13 points, C → A-)
- AIO: 70 → 88 (+18 points, C → B+)
- Overall: 75 → 90 (+15 points, C → A-)

**Quick Wins (10 minutes, +16 points):**
1. Shorten headline → +3 SEO
2. Add CTA at end → +10 SEO
3. Add structured claims → +20 AIO
4. Add one keyword mention → +3 SEO
Total: 75 → 91 (C → A-)

**Complete Optimization (30 minutes, +31 points):**
1. All quick wins
2. Expand content to 500 words → +10 SEO
3. Add FAQ section → +5 AIO
Total: 75 → 90 (C → A-)

---

## Output Formats

### 1. Console Report
```
📊 SEO + AIO OPTIMIZATION REPORT
======================================================================

🎯 SCORES:
  SEO Score: 79/100 (C)
  AIO Score: 70/100 (C)
  Overall:   75/100 (C)

📝 Status: Fair - Acceptable, but significant improvements recommended
✅ Ready to Publish: YES

🚨 CRITICAL ISSUES:
  • No structured claims with evidence
    → Add cpo:claims array with factual claims and evidence sources

⚠️  WARNINGS:
  • [SEO] Content too short (183 words)
    → Aim for 300-800 words for better ranking potential
  • [SEO] Missing call-to-action
    → Add CTA to improve engagement signals

💡 OPTIMIZATION TIPS:
  • [SEO] Headline too long (> 70 chars)
    → Shorten headline for better SERP display
```

### 2. JSON-LD with Claims
```json
{
  "@context": [
    "https://schema.org",
    "https://campaign-press-ontology.org/ns/v1#"
  ],
  "@type": ["PressRelease"],
  "@id": "https://spanbergerforvirginia.com/press/spanberger-jobs-economy-data",
  "headline": "NEW DATA: U.S. Businesses Shed Jobs as Virginians Face Economic Uncertainty",
  "datePublished": "2025-10-02",
  "cpo:releaseType": "news_release",
  "cpo:issueArea": "taxes",
  "cpo:claims": [
    {
      "@type": "ClaimReview",
      "cpo:claimText": "U.S. private sector businesses lost 32,000 workers in September 2025",
      "cpo:evidence": "https://adpemploymentreport.com/2025/September/National-Employment-Report",
      "cpo:verificationStatus": "TRUE",
      "cpo:confidence": 0.95
    }
  ]
}
```

### 3. Publication-Ready HTML
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NEW DATA: U.S. Businesses Shed Jobs...</title>

    <!-- Basic SEO -->
    <meta name="description" content="The ADP National Employment Report...">
    <meta name="keywords" content="taxes, news release, Abigail Spanberger, economy">
    <link rel="canonical" href="https://spanbergerforvirginia.com/press/...">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://spanbergerforvirginia.com/press/...">
    <meta property="og:title" content="NEW DATA: U.S. Businesses Shed Jobs...">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": ["https://schema.org", "https://campaign-press-ontology.org/ns/v1#"],
      "@type": ["PressRelease"],
      "cpo:claims": [...]
    }
    </script>
</head>
<body>
    <article class="press-release">
        <!-- Clean, readable prose -->
    </article>
</body>
</html>
```

---

## Best Practices

### 1. Prose Quality First
- Write for humans (journalists, voters, staff)
- Clear, compelling, scannable
- No URLs or citations cluttering the text
- Strategic CTAs only

### 2. Structured Data for Machines
- All fact-checking sources in JSON-LD
- Comprehensive entity definitions
- Complete metadata
- Evidence URLs for every claim

### 3. Optimization Workflow
```
1. Write compelling prose
   ↓
2. Parse and generate JSON-LD
   ↓
3. Run SEO/AIO analysis
   ↓
4. Review recommendations
   ↓
5. Improve prose (content, structure)
   ↓
6. Add structured claims to JSON-LD
   ↓
7. Re-analyze for score improvement
   ↓
8. Publish when scores are acceptable
```

### 4. When to Publish

**Minimum standards:**
- Overall score: 70+ (C or better)
- No critical issues
- At least basic structured data

**Ideal standards:**
- Overall score: 85+ (B+ or better)
- SEO: 80+ (keyword optimization, good length, CTA)
- AIO: 80+ (structured claims with evidence, Q&A format)

### 5. Continuous Improvement
- Monitor which releases perform best in AI search
- A/B test different headline styles
- Track which structured claim formats get cited most
- Refine keyword strategy based on actual queries

---

## API Usage

### Basic Analysis
```javascript
const SEOAIOAnalyzer = require('./backend/utils/seo-aio-analyzer');
const analyzer = new SEOAIOAnalyzer();

const analysis = analyzer.analyze(content, jsonld, parseResult);

console.log(analysis.scores);
// { seo: 79, aio: 70, overall: 75 }

console.log(analysis.summary);
// { status: "Fair - Acceptable...", readyToPublish: true, seoGrade: "C", ... }

console.log(analysis.issues);
// Array of issues with severity, category, recommendation
```

### Generate Report
```javascript
const report = analyzer.generateReport();
console.log(report);
// Formatted text report with emoji, sections, recommendations
```

### Filter by Severity
```javascript
const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
const warnings = analysis.issues.filter(i => i.severity === 'warning');
```

### Integration Example
```javascript
const parser = new PressReleaseParser();
const generator = new JSONLDGenerator();
const analyzer = new SEOAIOAnalyzer();

// Parse
const parseResult = parser.parse(content);

// Generate JSON-LD
const jsonld = generator.generate(parseResult, null, metadata);

// Analyze
const analysis = analyzer.analyze(content, jsonld, parseResult);

// Generate publication files
const html = generator.generateHTML(jsonld, content, metadata);

// Output
fs.writeFileSync('release.html', html);
fs.writeFileSync('analysis.txt', analyzer.generateReport());

if (analysis.scores.overall < 70) {
    console.warn('⚠️  Score below recommended threshold. Review recommendations.');
}
```

---

## Roadmap

### Planned Enhancements
1. **Machine learning scoring**: Train on successful releases to improve recommendations
2. **Competitor analysis**: Compare against other campaigns' releases
3. **Real-time AI search testing**: Query ChatGPT/Perplexity with release and measure citation rate
4. **A/B testing framework**: Test multiple headline/format variants
5. **Performance tracking**: Monitor actual search rankings and AI citations
6. **Automated improvement suggestions**: Use LLM to generate optimized prose variations

### Integration Targets
1. Web editor with live scoring
2. Slack bot for quick analysis
3. Pre-publication checks in CI/CD
4. Post-publication monitoring dashboard

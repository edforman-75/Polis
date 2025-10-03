# Fact-Checking Quick Reference

## 4 Claim Types

| Type | Verification | Time | Example |
|------|-------------|------|---------|
| **Direct Factual** | Standard sources | 5 min | "Crime decreased 15% (FBI data)" |
| **Private Data** | Unverifiable | 1 min | "Our internal polls show..." |
| **Hearsay** | Two-step (attribution + content) | 10 min | "Governor told us that..." |
| **Plausible Deniability** | Extract underlying claim | 7 min | "People are saying..." |

---

## Source Credibility Tiers

| Tier | Score | Examples |
|------|-------|----------|
| Federal Government | 1.0 | congress.gov, fbi.gov, cdc.gov |
| Fact-Checkers | 0.9 | factcheck.org, politifact.com |
| Research | 0.85 | brookings.edu, pewresearch.org |
| National News | 0.75 | nytimes.com, washingtonpost.com |
| Regional News | 0.65 | Local newspapers |
| Blogs/Opinion | 0.3 | Personal blogs |

---

## Verification Ratings

- **TRUE** - Completely accurate
- **MOSTLY TRUE** - Minor inaccuracies
- **MIXED** - Partially true/false
- **MOSTLY FALSE** - Core claim inaccurate
- **FALSE** - Completely inaccurate
- **UNVERIFIABLE** - Cannot be determined

---

## Quick Workflow

```
1. Create fact-check → POST /api/fact-checking/create
2. Extract claims → POST /api/fact-checking/:id/extract-claims
3. Verify each claim → POST /api/fact-checking/:factCheckId/claims/:claimId/verify
4. Complete → PATCH /api/fact-checking/:id (status: completed)
```

---

## Common Patterns to Watch

**Plausible Deniability:**
- "People are saying..."
- "Isn't it interesting..."
- "Some experts believe..."
- "Many are questioning..."

**Private Data (Unverifiable):**
- "Our polling shows..."
- "Internal data confirms..."
- "Focus groups found..."

**Hearsay (Two-Step):**
- "X told us that..."
- "As you heard X say..."
- "X mentioned that..."

---

## DO / DON'T

✅ **DO:**
- Use primary sources
- Document research process
- Note misleading context
- Flag recurring false claims
- Distinguish fact from opinion

❌ **DON'T:**
- Rate unverifiable as false
- Let bias influence ratings
- Skip source documentation
- Conflate predictions with facts
- Ignore context

---

**Full Documentation:** See [FACT_CHECKING_GUIDE.md](./FACT_CHECKING_GUIDE.md)

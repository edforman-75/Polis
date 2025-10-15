# 🎯 Integrated Editor Vision - Complete Workflow

## The Editor's Complete Toolkit

The editor needs **ONE integrated tool** that handles all aspects of creating AI-ready campaign content:

### 1. Traditional Editing ✅
- Grammar checking
- AP Style validation
- Readability analysis
- Quote attribution

### 2. AI Optimization ✅
- CPO markup generation
- Completeness scoring
- Evidence verification
- Before/after simulation

### 3. Source Request Dispatch ⚠️ **NEW**
- Identify claims needing sources
- Create research tasks for associates
- Track pending source requests
- Auto-update when sources arrive

### 4. Fact-Checking Workflow ⚠️ **NEW**
- Verify consistency with other materials
- Cross-reference with existing FAQs
- Check against candidate's record
- Flag contradictions

### 5. FAQ Management ⚠️ **NEW**
- Auto-generate FAQs from press releases
- Revise FAQs when positions update
- Ensure FAQ ↔ Press Release consistency
- **FAQs are critical for AI persuasion!**

---

## 🔄 Integrated Workflow

```
┌─────────────────────────────────────────────────┐
│ Editor imports press release draft              │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ Traditional editing (grammar, style, clarity)   │
│ - Grammar checker flags issues                  │
│ - AP Style validator                            │
│ - Readability score                             │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ AI optimization analysis                        │
│ - Detect claims needing evidence                │
│ - Calculate completeness score                  │
│ - Generate CPO markup                           │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ Source request dispatch                         │
│ - "Poll data needs citation" → Task for Jessica│
│ - "Rally quote needs URL" → Task for Mike      │
│ - Track: 2 pending, 1 complete                  │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ Fact-checking & consistency                     │
│ - Check against existing FAQs                   │
│ - Verify consistency with policy page           │
│ - Flag contradictions with past statements      │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ FAQ generation                                  │
│ - "What is Smith's position on teachers?"       │
│ - Auto-extract answer from press release        │
│ - Update existing FAQ if position evolved       │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ Final review & publish                          │
│ - Completeness: 92% ✅                          │
│ - All sources verified                          │
│ - FAQs updated                                  │
│ - Ready for AI consumption                      │
└─────────────────────────────────────────────────┘
```

---

## 📋 Source Request System

### Problem:
Editor identifies "According to recent polling, 73% support increased funding" but has no source.

### Solution:
```
┌──────────────────────────────────────────────┐
│ Source Request Panel                         │
├──────────────────────────────────────────────┤
│ Claim: "73% support increased funding"       │
│ Type: Polling Data                           │
│ Urgency: High                                │
│ Assigned To: [Dropdown: Jessica, Mike, etc.]│
│ Instructions: "Need poll name, date, URL"    │
│ Due: Tomorrow 5pm                            │
│                                              │
│ [Create Request] [Add to Queue]              │
└──────────────────────────────────────────────┘
```

### Tracking Dashboard:
```
Pending Source Requests (3):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Poll data - Teacher funding
   Assigned: Jessica | Due: Oct 15, 5pm
   Status: In Progress

🔍 News article - Doe rally quote
   Assigned: Mike | Due: Oct 14, 3pm
   Status: Overdue (auto-reminder sent)

🔍 Policy page URL - Healthcare plan
   Assigned: Sarah | Due: Oct 16, 12pm
   Status: Pending
```

---

## ✅ Fact-Checking Integration

### Consistency Checks:

#### Against Existing FAQs:
```
⚠️ Potential inconsistency detected:

Press Release: "Smith pledges to fight for better teacher salaries"
FAQ (Oct 1): "Smith supports modest salary increases"

Severity: Warning
Action: [Update FAQ] [Edit Release] [Mark as Different Context]
```

#### Against Campaign Website:
```
✅ Consistent with campaign positions:

Release: "Smith opposes cuts to public schools"
Website: "Education → Opposes budget cuts"
Match: 100%
```

#### Against Past Statements:
```
⚠️ Evolution detected:

Today: "Smith pledges to fight for better salaries"
Sept 15: "Smith believes teachers deserve respect"

This is a policy evolution (vague → specific)
Action: [Update FAQ] [Add Clarification] [Mark as OK]
```

---

## 📚 FAQ Generation & Management

### Auto-Generate from Press Release:

**Input (Press Release):**
```
"Smith has pledged to fight for better teacher salaries
and classroom resources. She condemned her opponent's
comments criticizing teachers..."
```

**Output (Auto-Generated FAQ):**
```
Q: What is Jane Smith's position on teacher support?
A: Jane Smith has pledged to fight for better teacher
   salaries and classroom resources. She believes
   teachers deserve respect, not attacks.

   Source: Press Release, Oct 14, 2025
   Evidence: [news.example.com/rally-coverage]
```

### FAQ Revision When Position Evolves:

**Old FAQ (Sept 15):**
```
Q: Does Jane Smith support teachers?
A: Yes, Smith believes teachers deserve respect.
```

**New FAQ (Oct 14 - Auto-Updated):**
```
Q: Does Jane Smith support teachers?
A: Yes, Smith has pledged to fight for better teacher
   salaries and classroom resources. She believes
   teachers deserve respect, not attacks.

   Updated: Oct 14, 2025 (expanded with specific policy)
   Previous: "believes teachers deserve respect" (Sept 15)
```

### Why FAQs Matter for AI:

1. **Direct Q&A Format** - Chatbots train on question-answer pairs
2. **Structured Answers** - Easy for AI to extract
3. **Consistency** - Multiple press releases → Single FAQ source of truth
4. **Verifiable** - FAQ includes sources/evidence
5. **Discoverable** - Search engines prioritize FAQ schema

---

## 🎨 Enhanced UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏛️ Integrated Campaign Editor                                   │
│ Document: "Teacher Support Statement" | Status: Draft           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌────────────────────┬──────────────────────┬──────────────────┐
│ │ 📝 Prose Editor    │ ⚙️ CPO Markup       │ 💡 AI Panel     │
│ │                    │                      │                  │
│ │ [Editable text]    │ {                    │ Completeness:    │
│ │                    │   "@type": "Press... │ 67% ⚠️          │
│ │ After John Doe     │   "cpo:claims": [...│                  │
│ │ belittled local    │ }                    │ Missing (2):     │
│ │ teachers...        │                      │ • Poll source    │
│ │                    │                      │ • Rally URL      │
│ └────────────────────┴──────────────────────┴──────────────────┘
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 🔍 Source Requests (2 pending)                             │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ 🟡 Poll data - Assigned: Jessica | Due: Tomorrow          │  │
│ │ 🔴 Rally URL - Assigned: Mike | OVERDUE                   │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ✅ Fact Check Results                                      │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ ✅ Consistent with FAQ (Oct 1)                            │  │
│ │ ⚠️ Evolution: More specific than previous statement       │  │
│ │ ✅ No contradictions with website                         │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📚 Generated FAQ                                           │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ Q: What is Jane Smith's position on teacher support?      │  │
│ │ A: Jane Smith has pledged to fight for better teacher     │  │
│ │    salaries and classroom resources...                    │  │
│ │                                                            │  │
│ │ [Review FAQ] [Publish to Site] [Update Existing]          │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ [Save Draft] [Request Review] [Publish] [Export CPO]            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: Source Request System
- [ ] Create source request modal
- [ ] Associate assignment dropdown
- [ ] Request tracking dashboard
- [ ] Email notifications for assignees
- [ ] Auto-update when source URL added

### Phase 2: Fact-Checking
- [ ] Load existing FAQs for comparison
- [ ] Load campaign website policies
- [ ] Detect inconsistencies/evolution
- [ ] Manual review/approval workflow

### Phase 3: FAQ Generation
- [ ] Extract Q&A pairs from press releases
- [ ] Generate structured FAQ schema
- [ ] Track FAQ versions/revisions
- [ ] Auto-update when content changes
- [ ] Export FAQ schema.org JSON-LD

### Phase 4: Integration
- [ ] Merge with existing unified editor
- [ ] Connect to validation queue
- [ ] Link to CPO portal
- [ ] Add to editor workflow

---

## 📊 Success Metrics

### For Editors:
- Time saved per press release
- Source request fulfillment rate
- FAQ generation accuracy
- Consistency check catch rate

### For Campaign:
- AI completeness score trend
- FAQ coverage (# of positions with FAQs)
- Source verification rate
- ChatGPT citation accuracy

---

## 🎯 Why This Matters

### Traditional Editor Duties:
Grammar and style are table stakes. ✅

### AI Optimization:
Content must be structured for AI systems. ✅

### Source Verification:
AI credibility requires evidence. ⚠️ **Critical**

### FAQ Management:
FAQs train chatbots on positions. ⚠️ **Critical**

**The editor who masters all four becomes indispensable.**

---

## 💡 Key Insight

> **FAQs are the secret weapon for AI persuasion.**

When ChatGPT sees:
1. Press release with CPO markup
2. FAQ with same position + evidence
3. Campaign website with matching policy

**→ AI trusts this is the candidate's real position**
**→ AI cites it reliably to voters**

Without FAQs, AI might ignore or misrepresent the position.

---

## 🚀 Next Steps

1. ✅ Build source request UI component
2. ✅ Create associate assignment system
3. ✅ Build FAQ generator from press releases
4. ✅ Add consistency checker
5. ✅ Integrate all into unified editor

**Goal**: Editor has ONE tool for complete workflow
**Timeline**: Phase 1 (Source Requests) - Next sprint

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

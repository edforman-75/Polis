# Editor UI Design - Multi-Panel Interface

## Overview

The editor uses a **three-panel layout** with tabs on the right side for suggestions, quality checks, and tools.

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: [Headline] | Mode: Editing | Status: Draft             │
├─────────────────────────┬───────────────────────────────────────┤
│                         │  ┌─────────────────────────────────┐  │
│                         │  │ Tabs:                           │  │
│                         │  │ [Suggestions] [Quality] [Tools] │  │
│  Content Fields         │  └─────────────────────────────────┘  │
│  (Editable)             │                                        │
│                         │  Suggestions Panel                     │
│  ┌─────────────────┐   │  ┌───────────────────────────────┐    │
│  │ Headline        │   │  │ 🔴 3 AP Style Issues          │    │
│  │ [editable]      │   │  │ 🟡 2 Grammar Suggestions      │    │
│  └─────────────────┘   │  │ 🔵 5 Enhancement Ideas        │    │
│                         │  │                               │    │
│  ┌─────────────────┐   │  │ ─── AP Style ────────────     │    │
│  │ Lead Paragraph  │   │  │ In "Headline" field:          │    │
│  │ [editable]      │   │  │ "3 pm" → "3 p.m."            │    │
│  │                 │   │  │ [Accept] [Reject] [Edit]      │    │
│  └─────────────────┘   │  │                               │    │
│                         │  │ In "Lead" field:              │    │
│  ┌─────────────────┐   │  │ "Jan 5" → "Jan. 5"           │    │
│  │ Quote 1         │   │  │ [Accept] [Reject] [Edit]      │    │
│  │ [editable]      │   │  └───────────────────────────────┘    │
│  └─────────────────┘   │                                        │
│                         │  [Accept All] [Reject All]            │
│  [More fields...]       │                                        │
│                         │                                        │
└─────────────────────────┴───────────────────────────────────────┘
│  Footer: [Preview] [Export] [Track Changes]                     │
└─────────────────────────────────────────────────────────────────┘
```

## Panel Breakdown

### Left Panel: Content Fields (60% width)
**Editable Fields with Inline Indicators:**
- Each field is directly editable (contenteditable or textarea)
- Inline highlights show where suggestions apply
- Hover over highlight shows preview of suggestion
- Click field to see related suggestions in right panel

**Visual Indicators:**
- 🔴 Red underline = Error (AP Style, Grammar)
- 🟡 Yellow underline = Warning (Voice, Tone)
- 🔵 Blue underline = Suggestion (Enhancement, SEO)

### Right Panel: Tabbed Interface (40% width)

#### **Tab 1: Suggestions** 📝
Grouped by severity and category:

```
┌─────────────────────────────────────┐
│ Suggestions (12)        [Filter ▼] │
├─────────────────────────────────────┤
│ Show: [All] [Errors] [Suggestions]  │
│                                     │
│ 🔴 Errors & Warnings (5)            │
│ ──────────────────────────          │
│ AP Style - Headline                 │
│ "3 pm" should be "3 p.m."          │
│ Rationale: AP Style requires...    │
│ [Accept] [Reject] [Edit]            │
│ ─────────────────────────────       │
│ Grammar - Lead Paragraph            │
│ Passive voice detected              │
│ "was announced" → "announced"       │
│ [Accept] [Reject] [Edit]            │
│                                     │
│ 🔵 Enhancements (7)                 │
│ ──────────────────────────          │
│ Prose - Quote 1                     │
│ Consider stronger verb              │
│ "said" → "declared"                 │
│ [Accept] [Reject] [Edit]            │
│                                     │
│ [Accept All Errors]                 │
│ [Review All Suggestions]            │
└─────────────────────────────────────┘
```

**Suggestion Card Details:**
- **Category tag**: AP Style, Grammar, Voice, etc.
- **Field reference**: Which field this applies to
- **Change preview**: Before → After
- **Rationale**: Why this change is suggested
- **Confidence**: 85% confidence (shown for AI suggestions)
- **Actions**: Accept | Reject | Edit (modify suggestion)

**Bulk Actions:**
- Accept All Errors (high confidence only)
- Accept All in Category
- Reject All Suggestions (keep errors)

#### **Tab 2: Quality Dashboard** 📊

```
┌─────────────────────────────────────┐
│ Quality Metrics                     │
├─────────────────────────────────────┤
│ Overall Score: 4.2/5.0 ⭐⭐⭐⭐      │
│                                     │
│ AP Style:        ████░ 4.0/5       │
│ Grammar:         █████ 5.0/5       │
│ Voice:           ███░░ 3.5/5       │
│ Reading Level:   Grade 9 ✓         │
│                                     │
│ ─── Content Analysis ────           │
│ Word Count: 342                     │
│ Sentence Avg: 18 words              │
│ Quotes: 2 detected                  │
│ Links: 0                            │
│                                     │
│ ─── Issues Summary ────             │
│ 🔴 3 errors must fix               │
│ 🟡 2 warnings recommend             │
│ 🔵 5 suggestions optional           │
│                                     │
│ [Run Quality Check]                 │
│ [View Detailed Report]              │
└─────────────────────────────────────┘
```

**Quality Indicators:**
- Real-time score updates as you edit
- Category breakdowns (AP Style, Grammar, Voice, etc.)
- Content metrics (word count, reading level)
- Issue summary with counts

#### **Tab 3: AI Tools** 🤖

```
┌─────────────────────────────────────┐
│ AI Writing Tools                    │
├─────────────────────────────────────┤
│ [Selected Text: "Lorem ipsum..."]   │
│                                     │
│ 🎨 Prose Enhancer                   │
│ Make selected text more compelling  │
│ [Enhance Selected Text]             │
│                                     │
│ 💬 Quote Improver                   │
│ Strengthen quote impact             │
│ [Improve Quote]                     │
│                                     │
│ 📰 Headline Generator               │
│ Generate alternative headlines      │
│ [Generate 5 Headlines]              │
│                                     │
│ ✂️ Summarizer                       │
│ Create shorter version              │
│ [Summarize to 100 words]            │
│                                     │
│ 🔍 Fact Checker                     │
│ Verify claims and statements        │
│ [Check Facts]                       │
│                                     │
│ ─── Quick Actions ────              │
│ [Add Pull Quote]                    │
│ [Insert Boilerplate]                │
│ [Add Call to Action]                │
└─────────────────────────────────────┘
```

## Interaction Flows

### Flow 1: Accepting a Suggestion
1. User sees red underline in headline: "3 pm"
2. Clicks on underlined text → Right panel highlights that suggestion
3. Reviews suggestion: "3 pm" → "3 p.m." (AP Style)
4. Clicks **[Accept]**
5. Text updates instantly in left panel
6. Suggestion disappears from right panel
7. Change recorded in track changes

### Flow 2: Rejecting a Suggestion
1. User sees blue underline in quote
2. Reviews suggestion: "said" → "declared"
3. Disagrees with suggestion
4. Clicks **[Reject]**
5. Underline disappears
6. Suggestion removed from panel
7. Rejection recorded (teaches AI not to suggest similar changes)

### Flow 3: Editing a Suggestion
1. User sees suggestion but wants to modify it
2. Clicks **[Edit]** on suggestion
3. Inline editor appears with suggestion text
4. User modifies: "declared" → "emphasized"
5. Clicks **[Apply]**
6. Custom edit applied to field
7. Recorded as "user-modified suggestion"

### Flow 4: Bulk Accept
1. User reviews all AP Style suggestions
2. All look correct
3. Clicks **[Accept All in Category]** at bottom
4. All AP Style changes applied at once
5. Confirmation dialog: "Applied 5 AP Style corrections"
6. Can undo all with single undo action

### Flow 5: Using AI Tools
1. User selects headline text in left panel
2. Switches to **Tools** tab
3. Clicks **[Generate 5 Headlines]**
4. Panel shows 5 alternative headlines
5. User clicks one to replace, or clicks **[Dismiss]**

## Visual Design Principles

### Color Coding
- **Red** (#ef4444): Errors - must fix
- **Yellow** (#f59e0b): Warnings - should fix
- **Blue** (#3b82f6): Suggestions - optional
- **Green** (#10b981): Accepted changes

### Typography
- **Field Labels**: 13px, uppercase, semibold, gray
- **Field Content**: 15px, regular, dark
- **Suggestion Text**: 14px, monospace for before/after
- **Rationale**: 13px, regular, muted

### Spacing
- Left panel: 60% width on desktop, 100% on mobile
- Right panel: 40% width on desktop, collapsible on mobile
- Suggestion cards: 16px padding, 12px gap between cards
- Field spacing: 20px vertical gap

## Keyboard Shortcuts

- **⌘+Enter**: Accept current suggestion
- **⌘+Delete**: Reject current suggestion
- **⌘+E**: Enhance selected text
- **⌘+K**: Run quality check
- **⌘+Shift+A**: Accept all high-confidence suggestions
- **⌘+/** : Toggle suggestions panel
- **Tab**: Navigate to next suggestion
- **Shift+Tab**: Navigate to previous suggestion

## Mobile Responsive Behavior

### Desktop (> 1024px)
- Three columns: Fields (60%) | Suggestions (40%)
- Tabs always visible

### Tablet (768px - 1024px)
- Two columns: Fields (55%) | Suggestions (45%)
- Tabs stacked vertically

### Mobile (< 768px)
- Single column, suggestions panel at bottom
- Swipe up to expand suggestions
- Floating action button for quick access to suggestions count
- Tap field to see its suggestions

## Progressive Enhancement

### Suggestions Loading States
1. **Initial**: "Analyzing content..." with spinner
2. **Loaded**: "12 suggestions found"
3. **Filtered**: "Showing 3 AP Style issues"
4. **Empty**: "No suggestions - looking good! ✨"

### Real-time Updates
- As user types, suggestions update with 500ms debounce
- New suggestions fade in
- Resolved suggestions fade out
- Counter updates in tab badges

### Error Handling
- If AI suggestion fails: "Unable to generate suggestion - try again"
- If fact check fails: "Fact checking unavailable"
- Always allow manual editing regardless of AI status

## Accessibility

- **ARIA labels**: All suggestions have descriptive labels
- **Keyboard navigation**: Full keyboard support
- **Screen reader**: Announces suggestion count and changes
- **Focus management**: Focus moves to accepted change location
- **Color contrast**: All text meets WCAG AA standards
- **High contrast mode**: Works with system high contrast

## Settings Integration

Users can disable specific suggestion types in Settings:
- Disabled checks don't appear in suggestions panel
- Inline underlines don't show for disabled checks
- Saves processing time by not running disabled checks

This provides a **professional, efficient workflow** where editors can:
✅ See all suggestions organized by priority
✅ Accept/reject/modify suggestions individually or in bulk
✅ Use AI tools for content enhancement
✅ Monitor quality metrics in real-time
✅ Customize which checks run via settings

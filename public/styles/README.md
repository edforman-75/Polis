# Design System

Common styles and utilities for consistent UI across all Campaign AI Editor interfaces.

## Files

- **design-system.css** - Core CSS with colors, typography, components
- **ui-utils.js** - Reusable JavaScript utilities

## Usage

Include in your HTML:

```html
<head>
    <link rel="stylesheet" href="/styles/design-system.css">
    <script src="/styles/ui-utils.js"></script>
</head>
```

## CSS Variables

```css
--color-primary: #3b82f6
--color-secondary: #64748b
--color-success: #10b981
--color-warning: #f59e0b
--color-danger: #ef4444
```

## Components

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-sm">Small</button>
```

### Cards
```html
<div class="card">
    Card content
</div>
```

### Badges
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Warning</span>
```

### Resizable Panels
```html
<div class="split-view">
    <div class="split-panel split-panel-left">Left content</div>
    <div class="panel-resizer"></div>
    <div class="split-panel split-panel-right">Right content</div>
</div>

<script>
    initPanelResizers();
    applySavedPanelSplit();
</script>
```

## JavaScript Utilities

### Toast Notifications
```javascript
showToast('Success!', 'success');
showToast('Error occurred', 'error');
showToast('Warning', 'warning');
```

### Panel Resizing
```javascript
// Initialize resizable panels
initPanelResizers();

// Apply saved split from localStorage
applySavedPanelSplit();
```

### Other Utilities
```javascript
// Debounce input handlers
const debouncedSearch = debounce(searchFunction, 300);

// Format dates
formatDate(new Date()); // "just now", "5m ago", "Dec 15"

// Copy to clipboard
copyToClipboard('text to copy');

// Confirm dialogs
const confirmed = await confirmDialog('Are you sure?');
```

## Color System

- **Primary**: Blue (#3b82f6) - Main actions, links
- **Success**: Green (#10b981) - Confirmations, positive states
- **Warning**: Orange (#f59e0b) - Alerts, needs attention
- **Danger**: Red (#ef4444) - Errors, destructive actions
- **Secondary**: Gray (#64748b) - Secondary actions

## Button Sizes

- **Default**: 6px 12px padding, 13px font
- **Small** (.btn-sm): 4px 8px padding, 12px font
- **Large** (.btn-lg): 8px 16px padding, 14px font

## Spacing

- **gap-sm**: 8px
- **gap-md**: 16px
- **gap-lg**: 24px
- **mb/mt-sm**: 8px
- **mb/mt-md**: 16px
- **mb/mt-lg**: 24px

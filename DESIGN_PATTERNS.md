# Dashboard Design Patterns

## Status Ribbon Pattern

The status ribbon is our primary design pattern for displaying overview information and enabling quick navigation/filtering.

### Key Principles

1. **Information Density**: Maximum information in minimum vertical space
2. **Single Source of Truth**: No duplicate information across the interface
3. **Progressive Interaction**: Static summary cards + interactive filter cards
4. **Visual Hierarchy**: Clear distinction between informational and actionable elements

### Structure

```html
<div class="status-ribbon">
    <div class="ribbon-title">Section Title</div>
    <div class="ribbon-cards">
        <!-- Summary cards (non-interactive) -->
        <div class="ribbon-card summary-card" style="background: #f8fafc;">
            <div class="card-icon">📊</div>
            <div class="card-info">
                <div class="card-label">Label</div>
                <div class="card-value">Value</div>
            </div>
        </div>

        <!-- Interactive filter cards -->
        <div class="ribbon-card status-new" onclick="filterByStatus('new')" data-status="new">
            <div class="card-icon">📥</div>
            <div class="card-info">
                <div class="card-label">New</div>
                <div class="card-value" id="newCount">4</div>
            </div>
        </div>
    </div>
</div>
```

### CSS Framework

```css
/* Status ribbon design pattern */
.status-ribbon {
    background: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ribbon-title {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.ribbon-cards {
    display: flex;
    gap: 6px;
    justify-content: space-between;
}

.ribbon-card {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 0;
}

.ribbon-card:hover {
    background: #f8fafc;
    transform: translateY(-1px);
}

.ribbon-card.selected {
    background: #e0f2fe;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.ribbon-card.summary-card {
    cursor: default;
    border: 1px solid #e2e8f0;
}

.ribbon-card.summary-card:hover {
    background: inherit;
    transform: none;
}

.card-icon {
    font-size: 16px;
    margin-right: 8px;
    flex-shrink: 0;
}

.card-info {
    flex: 1;
    min-width: 0;
}

.card-label {
    font-size: 11px;
    color: #64748b;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-value {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1;
}
```

### Color Scheme for Status Types

#### Assignment Status Colors
- **New**: `#f0f9ff` (Light blue)
- **In Progress**: `#fffbeb` (Light orange)
- **Under Review**: `#faf5ff` (Light purple)
- **Blocked**: `#fef2f2` (Light red)
- **Completed**: `#f0fdf4` (Light green)

#### Summary Card Colors
- **Total/Count**: `#f8fafc` (Light gray)
- **Performance/Score**: `#f0fdf4` (Light green)
- **Time-based**: `#fef3c7` (Light yellow)
- **Status-based**: `#eff6ff` (Light blue)

### JavaScript Pattern

```javascript
// Filter state management
let currentFilter = '';

function filterByStatus(status) {
    // Toggle filter if clicking the same status
    if (currentFilter === status) {
        currentFilter = '';
        document.querySelectorAll('.ribbon-card').forEach(card => {
            card.classList.remove('selected');
        });
    } else {
        currentFilter = status;
        document.querySelectorAll('.ribbon-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-status="${status}"]`).classList.add('selected');
    }

    // Apply filter logic
    applyFilters();
}

function updateRibbonCounts(data) {
    // Update all counts dynamically
    document.getElementById('totalCount').textContent = data.total;
    document.getElementById('newCount').textContent = data.new;
    // ... etc
}
```

### When to Use

✅ **Use the ribbon pattern for:**
- Dashboard overview sections
- Status pipelines with filtering
- Key metrics that need quick access
- Navigation between data views
- Progress indicators with interaction

❌ **Don't use for:**
- Complex forms
- Detailed data entry
- Single-purpose displays
- When vertical space is abundant

### Responsive Behavior

- **Desktop**: Full horizontal layout with all cards visible
- **Tablet**: Maintain horizontal layout, may wrap to two rows if needed
- **Mobile**: Consider stacking or hiding less critical cards

### Implementation Examples

1. **Assignment Dashboard**: Status pipeline with filtering
2. **Writer Dashboard**: Performance overview ribbon
3. **Content Pipeline**: Content status with type filtering
4. **Team Dashboard**: Member status with role filtering
5. **Analytics Dashboard**: Metrics overview with time period selection

### Benefits

- **Space Efficient**: 70-80% reduction in vertical space vs. traditional card grids
- **Information Dense**: 5-7 data points visible at once
- **Interactive**: Direct manipulation without separate controls
- **Consistent**: Reusable pattern across all dashboards
- **Accessible**: Clear visual hierarchy and interaction states
- **Responsive**: Adapts well to different screen sizes

This pattern should be the foundation for all dashboard overview sections in the Campaign AI system.
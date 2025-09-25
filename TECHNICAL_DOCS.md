# Campaign AI Editor - Technical Documentation

## System Architecture

### Overview

The Campaign AI Editor is a single-page application (SPA) built with vanilla JavaScript, HTML5, and CSS3. It provides a comprehensive content management system specifically designed for political campaign communications.

### Core Components

```
campaign-ai-editor/
├── integrated-editor.html    # Main application
├── plugin.php              # WordPress integration
├── USER_GUIDE.md           # User documentation
├── TECHNICAL_DOCS.md       # This document
├── PRD-Campaign-AI-Editor.md # Product requirements
└── src/                    # Component library
    ├── blocks/             # Content block components
    ├── components/         # Reusable UI components
    └── hooks/              # Custom functionality hooks
```

## Technical Stack

### Frontend
- **HTML5**: Semantic markup with accessibility support
- **CSS3**: Modern layouts with Grid and Flexbox
- **JavaScript ES6+**: Modern JavaScript with modules
- **Local Storage**: Client-side data persistence
- **WebRTC**: Real-time collaboration features

### Security
- **Content Security Policy**: XSS protection
- **Input Sanitization**: Server-side validation
- **Session Management**: Secure authentication
- **Audit Logging**: Complete activity tracking

### Performance
- **Lazy Loading**: On-demand component loading
- **Debounced Operations**: Optimized user interactions
- **Caching**: Intelligent search and content caching
- **Memory Management**: Efficient resource usage

## API Reference

### Performance Monitoring

```javascript
// Get performance statistics
const stats = window.campaignEditorStats();

// Memory usage analysis
window.campaignEditorMemory();

// Export audit logs
window.exportAuditLogs();
```

### User Testing Framework

```javascript
// Start user testing mode
window.startUserTesting();

// Access testing framework
const testing = window.UserTestingFramework;

// Stop testing and export results
testing.stopTesting();
```

### Security Utilities

```javascript
// HTML sanitization
const safe = SecurityUtils.sanitizeHTML(userInput);

// Input validation
const isValid = SecurityUtils.validateInput(input, maxLength, allowedChars);

// Session validation
const sessionValid = SecurityUtils.validateSession();
```

### Audit Logger

```javascript
// Log custom events
AuditLogger.log('custom_action', { details: 'action details' });

// Get recent logs
const recentLogs = AuditLogger.getRecentLogs(50);

// Export audit trail
AuditLogger.exportLogs();
```

## Configuration

### Environment Variables

```javascript
const CONFIG = {
    AUTO_SAVE_INTERVAL: 30000,      // 30 seconds
    SESSION_DURATION: 8 * 60 * 60 * 1000,  // 8 hours
    MAX_UNDO_HISTORY: 50,           // Maximum undo levels
    CACHE_DURATION: 5 * 60 * 1000,  // 5 minutes
    MAX_AUDIT_LOGS: 1000,           // Maximum log entries
    DEBOUNCE_DELAY: 750             // AI analysis delay
};
```

### User Roles & Permissions

```javascript
const ROLES = {
    WRITER: {
        permissions: ['edit_content', 'fact_check', 'voice_analysis'],
        restrictions: ['publish', 'admin_settings', 'user_management']
    },
    EDITOR: {
        permissions: ['edit_content', 'fact_check', 'voice_analysis', 'publish', 'review'],
        restrictions: ['admin_settings', 'user_management']
    },
    DIRECTOR: {
        permissions: ['all'],
        restrictions: []
    }
};
```

## Database Schema (LocalStorage)

### User Settings
```json
{
    "user-settings": {
        "content": {
            "suggestionLevel": "high",
            "autoVoice": true,
            "autoSave": true,
            "showAIScore": true
        },
        "factCheck": {
            "canResearch": true,
            "canVerify": false,
            "canAccessGov": true,
            "canAccessAcademic": false
        },
        "voice": {
            "canModify": false,
            "canUpload": false
        }
    }
}
```

### Organization Settings
```json
{
    "organization-settings": {
        "defaults": {
            "suggestionLevel": "medium",
            "autoVoice": true,
            "autoSave": true,
            "saveResearch": true,
            "voiceTraining": false
        },
        "locks": {
            "suggestion-level": false,
            "auto-voice": false,
            "auto-save": false,
            "notifications": false,
            "privacy": false
        },
        "brandKit": {
            "logo": {
                "primary": "data:image/...",
                "secondary": null
            },
            "colors": {
                "primary": "#1f2937",
                "secondary": "#3b82f6"
            }
        }
    }
}
```

### Document State
```json
{
    "documentState": {
        "headline": "string",
        "location": "string",
        "content": "string",
        "quote": "string",
        "isDirty": false,
        "lastSaved": 1640995200000,
        "lastModified": 1640995200000
    }
}
```

### Audit Log
```json
{
    "audit-log": [
        {
            "timestamp": "2024-01-01T12:00:00.000Z",
            "action": "content_edit",
            "details": {
                "field": "headline",
                "oldLength": 45,
                "newLength": 52
            },
            "sessionId": "session_1640995200000",
            "userAgent": "Mozilla/5.0...",
            "url": "https://example.com/editor"
        }
    ]
}
```

## Event System

### Document Events

```javascript
// Content change events
document.addEventListener('contentChange', (event) => {
    console.log('Content changed:', event.detail);
});

// Auto-save events
document.addEventListener('autoSave', (event) => {
    console.log('Auto-saved:', event.detail);
});

// Analysis complete events
document.addEventListener('analysisComplete', (event) => {
    console.log('AI analysis complete:', event.detail);
});
```

### Custom Events

```javascript
// Dispatch custom events
const event = new CustomEvent('customAction', {
    detail: { data: 'value' }
});
document.dispatchEvent(event);

// Listen for custom events
document.addEventListener('customAction', (event) => {
    console.log('Custom event:', event.detail);
});
```

## Performance Optimization

### Debouncing Strategy

```javascript
// Analysis debouncing
const debouncedAnalysis = (() => {
    let timeout = null;
    return function(fieldId, oldValue, newValue, delay = 750) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            performContentAnalysis(fieldId, oldValue, newValue);
        }, delay);
    };
})();
```

### Memory Management

```javascript
// Undo history management
function createUndoLevel(field, fromValue, toValue, changeType) {
    // ... create change object ...

    changeHistory.push(change);

    // Limit history size
    if (changeHistory.length > maxHistory) {
        changeHistory = changeHistory.slice(-maxHistory);
    }
}

// Search cache management
function optimizedSearch(query, searchFunction) {
    // ... check cache ...

    // Clean old cache entries periodically
    if (searchCache.size > 100) {
        const cutoff = Date.now() - CACHE_DURATION;
        for (const [key, value] of searchCache.entries()) {
            if (value.timestamp < cutoff) {
                searchCache.delete(key);
            }
        }
    }
}
```

### Lazy Loading

```javascript
// Modal lazy loading
let factResearchLoaded = false;

function openFactResearch() {
    if (!factResearchLoaded) {
        loadFactResearchComponents();
        factResearchLoaded = true;
    }
    // ... show modal ...
}
```

## Security Implementation

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:;
               connect-src 'self' https:;
               font-src 'self';">
```

### Input Sanitization

```javascript
// HTML sanitization
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Input validation
function validateInput(input, maxLength = 1000, allowedChars = /^[a-zA-Z0-9\s\.,!?\-'"():;&]*$/) {
    if (typeof input !== 'string') return false;
    if (input.length > maxLength) return false;
    return allowedChars.test(input);
}
```

### Session Management

```javascript
// Session validation
function validateSession() {
    const sessionStart = localStorage.getItem('session-start');
    const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours

    if (!sessionStart || (Date.now() - parseInt(sessionStart)) > sessionDuration) {
        localStorage.removeItem('session-start');
        return false;
    }
    return true;
}
```

## Testing Framework

### User Testing Implementation

```javascript
const UserTestingFramework = {
    // Start testing session
    startTesting() {
        this.isTestingMode = true;
        this.testSession = {
            id: 'test_' + Date.now(),
            startTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        };
        this.setupTestingListeners();
    },

    // Track user interactions
    logInteraction(type, details) {
        if (!this.isTestingMode) return;

        this.interactions.push({
            timestamp: new Date().toISOString(),
            type: type,
            details: details,
            sessionTime: Date.now() - new Date(this.testSession.startTime).getTime()
        });
    }
};
```

### Automated Testing Hooks

```javascript
// Test data injection
window.injectTestData = function(data) {
    documentState = { ...documentState, ...data };
    initializeEditor();
};

// Performance benchmarking
window.runPerformanceBenchmark = function() {
    const start = performance.now();
    performInitialAnalysis();
    const end = performance.now();
    return { duration: end - start };
};
```

## Integration Points

### WordPress Plugin Integration

```php
// Plugin registration
function register_campaign_ai_editor() {
    wp_enqueue_script('campaign-ai-editor',
        plugin_dir_url(__FILE__) . 'integrated-editor.html',
        array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'register_campaign_ai_editor');
```

### External API Integration

```javascript
// Fact-checking API
async function verifyFact(claim) {
    try {
        const response = await fetch('/api/fact-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claim })
        });
        return await response.json();
    } catch (error) {
        console.error('Fact-check API error:', error);
        return null;
    }
}

// Voice analysis API
async function analyzeVoice(content) {
    try {
        const response = await fetch('/api/voice-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        return await response.json();
    } catch (error) {
        console.error('Voice analysis API error:', error);
        return null;
    }
}
```

## Deployment

### Production Checklist

- [ ] Content Security Policy configured
- [ ] HTTPS enabled
- [ ] Session security implemented
- [ ] Audit logging active
- [ ] Performance monitoring enabled
- [ ] Error reporting configured
- [ ] Backup systems in place
- [ ] User training completed

### Browser Compatibility

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome  | 88+     | Full          |
| Firefox | 85+     | Full          |
| Safari  | 14+     | Full          |
| Edge    | 88+     | Full          |
| Mobile  | iOS 14+ | Responsive    |

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB available space
- **Network**: Broadband internet connection
- **Browser**: Modern browser with JavaScript enabled

## Maintenance

### Regular Tasks

1. **Daily**: Monitor error logs and performance metrics
2. **Weekly**: Review audit logs for security issues
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Performance optimization review

### Backup Procedures

```javascript
// Export all data
function exportAllData() {
    const data = {
        userSettings: localStorage.getItem('user-settings'),
        orgSettings: localStorage.getItem('organization-settings'),
        auditLog: localStorage.getItem('audit-log'),
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)],
        { type: 'application/json' });
    // ... download logic ...
}
```

### Monitoring

```javascript
// Performance monitoring
setInterval(() => {
    const stats = performanceMetrics.getStats();
    if (stats.averageAnalysisTime > 5000) {
        console.warn('Performance degradation detected');
    }
}, 60000); // Check every minute
```

## Troubleshooting

### Common Issues

**High Memory Usage**
- Check `changeHistory.length` - should be ≤ 50
- Check `searchCache.size` - should be ≤ 100
- Clear browser cache periodically

**Slow Performance**
- Monitor `performanceMetrics.averageAnalysisTime`
- Check network connectivity
- Verify browser compatibility

**Security Warnings**
- Review `audit-log` for violations
- Check session validity
- Verify CSP compliance

### Debug Tools

```javascript
// Enable debug mode
window.DEBUG = true;

// Performance debugging
console.table(performanceMetrics.getStats());

// Memory debugging
console.table(window.campaignEditorMemory());

// Audit debugging
console.table(AuditLogger.getRecentLogs(10));
```

## Contributing

### Code Style

- Use modern JavaScript (ES6+)
- Follow semantic HTML principles
- Implement progressive enhancement
- Maintain accessibility standards
- Write self-documenting code

### Security Guidelines

- Sanitize all user inputs
- Validate data on both client and server
- Implement principle of least privilege
- Log all security-relevant events
- Regular security reviews

---

*For technical support or feature development, refer to the development team.*
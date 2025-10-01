/**
 * Application Settings UI - Manages parser and editor settings
 */

let editChecks = {};
let editChecksByCategory = {};

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Load all settings on page load
async function loadAllSettings() {
    await Promise.all([
        loadParserSettings(),
        loadParserStats(),
        loadEditorSettings(),
        loadEditChecks()
    ]);
}

// === PARSER SETTINGS ===

async function loadParserSettings() {
    try {
        const response = await fetch('/api/settings/parser');
        const settings = await response.json();

        if (settings) {
            document.getElementById('parser-auto-extract-context').checked = settings.auto_extract_context === 1;
            document.getElementById('parser-validate-settings').checked = settings.validate_against_campaign_settings === 1;
            document.getElementById('parser-context-threshold').value = settings.context_confidence_threshold || 0.7;
            document.getElementById('parser-extract-quotes').checked = settings.extract_quotes === 1;
            document.getElementById('parser-extract-contacts').checked = settings.extract_contact_info === 1;
            document.getElementById('parser-extract-boilerplate').checked = settings.extract_boilerplate === 1;
            document.getElementById('parser-extract-dates').checked = settings.extract_dates === 1;
            document.getElementById('parser-cleanup-whitespace').checked = settings.remove_excess_whitespace === 1;
            document.getElementById('parser-movement-detection').checked = settings.field_movement_detection === 1;
        }
    } catch (error) {
        console.error('Error loading parser settings:', error);
    }
}

async function loadParserStats() {
    try {
        const response = await fetch('/api/assignments/parser-quality-stats');
        const stats = await response.json();

        const statsCard = document.getElementById('parser-stats');
        if (stats && stats.total_ratings > 0) {
            statsCard.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${stats.avg_rating ? stats.avg_rating.toFixed(2) : '-'}</div>
                    <div class="stat-label">Avg Rating (out of 5)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.total_ratings || 0}</div>
                    <div class="stat-label">Total Rated</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.good_ratings || 0}</div>
                    <div class="stat-label">Good Ratings (4-5★)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.avg_corrections ? stats.avg_corrections.toFixed(1) : '-'}</div>
                    <div class="stat-label">Avg Corrections</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading parser stats:', error);
    }
}

async function saveParserSettings() {
    const settings = {
        auto_extract_context: document.getElementById('parser-auto-extract-context').checked ? 1 : 0,
        validate_against_campaign_settings: document.getElementById('parser-validate-settings').checked ? 1 : 0,
        context_confidence_threshold: parseFloat(document.getElementById('parser-context-threshold').value),
        extract_quotes: document.getElementById('parser-extract-quotes').checked ? 1 : 0,
        extract_contact_info: document.getElementById('parser-extract-contacts').checked ? 1 : 0,
        extract_boilerplate: document.getElementById('parser-extract-boilerplate').checked ? 1 : 0,
        extract_dates: document.getElementById('parser-extract-dates').checked ? 1 : 0,
        remove_excess_whitespace: document.getElementById('parser-cleanup-whitespace').checked ? 1 : 0,
        field_movement_detection: document.getElementById('parser-movement-detection').checked ? 1 : 0
    };

    try {
        const response = await fetch('/api/settings/parser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            showAlert('success', '✅ Parser settings saved successfully!');
        } else {
            showAlert('error', '⚠️ Failed to save parser settings.');
        }
    } catch (error) {
        console.error('Error saving parser settings:', error);
        showAlert('error', '⚠️ Error saving parser settings.');
    }
}

// === EDITOR SETTINGS ===

async function loadEditorSettings() {
    try {
        const response = await fetch('/api/settings/editor');
        const settings = await response.json();

        if (settings) {
            document.getElementById('editor-assistance-level').value = settings.ai_assistance_level || 'balanced';
            document.getElementById('editor-realtime').checked = settings.real_time_suggestions === 1;
            document.getElementById('editor-track-changes').checked = settings.track_all_changes === 1;

            // Suggestions display settings
            document.getElementById('editor-sort-order').value = settings.suggestions_sort_order || 'severity';
            document.getElementById('editor-group-by').value = settings.group_suggestions_by || 'category';
            document.getElementById('editor-show-accepted').checked = settings.show_accepted_suggestions === 1;
            document.getElementById('editor-auto-scroll').checked = settings.auto_scroll_to_suggestion === 1;
            document.getElementById('editor-collapse-low').checked = settings.collapse_low_priority === 1;
            document.getElementById('editor-inline-highlights').checked = settings.show_suggestions_inline === 1;
            document.getElementById('editor-min-confidence').value = settings.min_confidence_to_show || 0.5;
        }
    } catch (error) {
        console.error('Error loading editor settings:', error);
    }
}

async function loadEditChecks() {
    try {
        const response = await fetch('/api/settings/edit-checks');
        editChecks = await response.json();

        // Group by category
        editChecksByCategory = {};
        editChecks.forEach(check => {
            if (!editChecksByCategory[check.check_category]) {
                editChecksByCategory[check.check_category] = [];
            }
            editChecksByCategory[check.check_category].push(check);
        });

        // Render each category
        Object.entries(editChecksByCategory).forEach(([category, checks]) => {
            renderCategoryChecks(category, checks);
        });
    } catch (error) {
        console.error('Error loading edit checks:', error);
    }
}

function renderCategoryChecks(category, checks) {
    const container = document.getElementById(`category-${category}-checks`);
    if (!container) return;

    container.innerHTML = checks.map(check => `
        <div class="setting-item">
            <div class="setting-info">
                <div class="setting-label">${check.check_display_name}</div>
                <div class="setting-description">${check.check_description || ''}</div>
            </div>
            <div class="setting-control">
                <label class="toggle-switch">
                    <input type="checkbox"
                           class="edit-check-toggle"
                           data-check-name="${check.check_name}"
                           data-category="${category}"
                           ${check.enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>
    `).join('');

    // Add event listeners
    container.querySelectorAll('.edit-check-toggle').forEach(toggle => {
        toggle.addEventListener('change', () => {
            updateCategoryToggle(category);
        });
    });
}

function toggleCategory(category) {
    const container = document.getElementById(`category-${category}-checks`);
    if (container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function toggleCategoryAll(category, enabled) {
    const checkboxes = document.querySelectorAll(`.edit-check-toggle[data-category="${category}"]`);
    checkboxes.forEach(cb => {
        cb.checked = enabled;
    });
}

function updateCategoryToggle(category) {
    const checkboxes = document.querySelectorAll(`.edit-check-toggle[data-category="${category}"]`);
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const categoryToggle = document.getElementById(`category-${category}`);
    if (categoryToggle) {
        categoryToggle.checked = allChecked;
    }
}

async function saveEditorSettings() {
    // Save main editor settings
    const editorSettings = {
        ai_assistance_level: document.getElementById('editor-assistance-level').value,
        real_time_suggestions: document.getElementById('editor-realtime').checked ? 1 : 0,
        track_all_changes: document.getElementById('editor-track-changes').checked ? 1 : 0,

        // Suggestions display settings
        suggestions_sort_order: document.getElementById('editor-sort-order').value,
        group_suggestions_by: document.getElementById('editor-group-by').value,
        show_accepted_suggestions: document.getElementById('editor-show-accepted').checked ? 1 : 0,
        auto_scroll_to_suggestion: document.getElementById('editor-auto-scroll').checked ? 1 : 0,
        collapse_low_priority: document.getElementById('editor-collapse-low').checked ? 1 : 0,
        show_suggestions_inline: document.getElementById('editor-inline-highlights').checked ? 1 : 0,
        min_confidence_to_show: parseFloat(document.getElementById('editor-min-confidence').value)
    };

    try {
        const response1 = await fetch('/api/settings/editor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editorSettings)
        });

        // Save individual edit check states
        const checkStates = [];
        document.querySelectorAll('.edit-check-toggle').forEach(toggle => {
            checkStates.push({
                check_name: toggle.dataset.checkName,
                enabled: toggle.checked ? 1 : 0
            });
        });

        const response2 = await fetch('/api/settings/edit-checks/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checks: checkStates })
        });

        if (response1.ok && response2.ok) {
            showAlert('success', '✅ Editor settings saved successfully!');
        } else {
            showAlert('error', '⚠️ Failed to save editor settings.');
        }
    } catch (error) {
        console.error('Error saving editor settings:', error);
        showAlert('error', '⚠️ Error saving editor settings.');
    }
}

// === UTILITY ===

function showAlert(type, message) {
    const container = document.getElementById('alert-container');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;

    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize on load
loadAllSettings();

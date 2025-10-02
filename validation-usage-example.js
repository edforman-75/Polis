/**
 * VALIDATION SYSTEM USAGE EXAMPLES
 *
 * This file demonstrates how to use the press release validation system
 * in your application to ensure quality before processing.
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

// =============================================================================
// EXAMPLE 1: Parse with automatic validation
// =============================================================================

console.log('Example 1: Parse with validation (default)\n');

const pressReleaseText = `
FOR IMMEDIATE RELEASE

WASHINGTON, D.C. — October 2, 2025

Senator Smith Announces New Infrastructure Bill

Senator Jane Smith announced today a comprehensive infrastructure package.

"This bill will create jobs and rebuild our communities," said Senator Jane Smith.

"We're committed to sustainable development," Smith added.
`;

const result1 = parser.parseWithValidation(pressReleaseText);

console.log('Quality Score:', result1.validation.quality_score);
console.log('Status:', result1.validation.status);
console.log('Should Reject:', result1.validation.should_reject);

if (result1.validation.should_reject) {
    console.log('\n❌ REJECTED - Cannot process this press release');
    console.log('Errors:', result1.validation.errors);
} else {
    console.log('\n✅ ACCEPTED - Press release can be processed');
    console.log('Quotes found:', result1.quotes.length);
}

// =============================================================================
// EXAMPLE 2: Parse without validation (for backward compatibility)
// =============================================================================

console.log('\n\n' + '='.repeat(80));
console.log('Example 2: Parse without validation\n');

const result2 = parser.parse(pressReleaseText); // Original method still works
console.log('Quotes found:', result2.quotes.length);
console.log('(No validation data included)');

// =============================================================================
// EXAMPLE 3: Conditional processing based on quality
// =============================================================================

console.log('\n\n' + '='.repeat(80));
console.log('Example 3: Conditional processing based on quality\n');

function processPressRelease(text) {
    const result = parser.parseWithValidation(text);
    const val = result.validation;

    // Auto-reject if quality too low
    if (val.should_reject) {
        return {
            success: false,
            message: 'Press release rejected due to critical quality issues',
            errors: val.errors,
            suggestions: val.suggestions
        };
    }

    // Warn if quality is poor
    if (val.status === 'poor') {
        return {
            success: true,
            warning: 'Press release accepted with major quality issues',
            data: result,
            quality_score: val.quality_score,
            issues: val.warnings
        };
    }

    // Process normally
    return {
        success: true,
        message: `Press release accepted (${val.status})`,
        data: result,
        quality_score: val.quality_score
    };
}

const processResult = processPressRelease(pressReleaseText);
console.log('Processing Result:');
console.log(JSON.stringify(processResult, null, 2));

// =============================================================================
// EXAMPLE 4: Display validation feedback to user
// =============================================================================

console.log('\n\n' + '='.repeat(80));
console.log('Example 4: Display validation feedback\n');

function displayValidationFeedback(validation) {
    console.log(`Quality Score: ${validation.quality_score}/100 (${validation.status})`);

    if (validation.errors.length > 0) {
        console.log('\n❌ Critical Errors:');
        validation.errors.forEach(err => {
            console.log(`  • ${err.message}`);
            console.log(`    → ${err.suggestion}`);
        });
    }

    if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warn => {
            console.log(`  • [${warn.severity}] ${warn.message}`);
            console.log(`    → ${warn.suggestion}`);
        });
    }

    if (validation.suggestions.length > 0) {
        console.log('\n💡 Overall Suggestions:');
        validation.suggestions.forEach(sug => {
            console.log(`  • ${sug}`);
        });
    }
}

const badPressRelease = `
FOR IMMEDIATE RELEASE

Campaign Event Announcement

Please join us for a rally next week.
`;

const badResult = parser.parseWithValidation(badPressRelease);
displayValidationFeedback(badResult.validation);

// =============================================================================
// EXAMPLE 5: Use validation in API endpoint
// =============================================================================

console.log('\n\n' + '='.repeat(80));
console.log('Example 5: API endpoint pattern\n');

// Example Express.js endpoint
function handlePressReleaseUpload(req, res) {
    const text = req.body.press_release_text;

    // Parse with validation
    const result = parser.parseWithValidation(text);

    // Check if should reject
    if (result.validation.should_reject) {
        return res.status(400).json({
            success: false,
            error: 'Press release quality too low',
            validation: result.validation
        });
    }

    // Warn if poor quality but still processable
    if (result.validation.quality_score < 75) {
        return res.status(200).json({
            success: true,
            warning: 'Press release has quality issues',
            data: result,
            validation: result.validation
        });
    }

    // Success
    return res.status(200).json({
        success: true,
        data: result,
        validation: result.validation
    });
}

console.log('Example API endpoint pattern shown above');
console.log('Use validation.should_reject to determine if press release should be rejected');
console.log('Use validation.quality_score to provide feedback to users');

console.log('\n' + '='.repeat(80));
console.log('VALIDATION SYSTEM READY');
console.log('='.repeat(80));

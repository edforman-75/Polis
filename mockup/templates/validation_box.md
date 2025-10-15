## 🔍 Validation Results

### ❌ Errors (must fix)
{{ERRORS}}

### ⚠️ Warnings (nice to fix)
{{WARNINGS}}

{{#if ERRORS_COUNT}}
**Status**: ❌ Cannot publish until errors are resolved
{{else}}
**Status**: ✅ Ready to publish ({{WARNINGS_COUNT}} warnings)
{{/if}}

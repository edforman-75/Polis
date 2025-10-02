#!/bin/bash
# Add a corrected press release to the regression baseline
# Usage: ./add-to-baseline.sh <file.txt> <name> <headline> <dateline> <quote_count>

if [ "$#" -lt 4 ]; then
    echo "Usage: ./add-to-baseline.sh <file.txt> <name> <expected_headline> <expected_dateline> [quote_count]"
    echo ""
    echo "Example:"
    echo "  ./add-to-baseline.sh ./cpo_examples/release_01.txt \\"
    echo "    'Jane Smith Rally Announcement' \\"
    echo "    'Jane Smith to Hold Rally at High School Gym' \\"
    echo "    'SPRINGFIELD, IL - October 8, 2025' \\"
    echo "    0"
    exit 1
fi

FILE_PATH=$1
NAME=$2
HEADLINE=$3
DATELINE=$4
QUOTE_COUNT=${5:-0}

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File not found: $FILE_PATH"
    exit 1
fi

# Get current date
DATE=$(date +%Y-%m-%d)

# Create test-data directory if it doesn't exist
TEST_DATA_DIR="./test-data"
mkdir -p "$TEST_DATA_DIR"

# Copy the file to test-data with a sanitized name
BASENAME=$(basename "$FILE_PATH")
SANITIZED_NAME=$(echo "$BASENAME" | sed 's/[^a-zA-Z0-9._-]/_/g')
DEST_PATH="$TEST_DATA_DIR/$SANITIZED_NAME"

cp "$FILE_PATH" "$DEST_PATH"
echo "✓ Copied $FILE_PATH to $DEST_PATH"

# Add entry to parser-baselines.json
BASELINE_FILE="$TEST_DATA_DIR/parser-baselines.json"

# Read current baselines
if [ ! -f "$BASELINE_FILE" ]; then
    echo "[]" > "$BASELINE_FILE"
fi

# Create new baseline entry
NEW_ENTRY=$(cat <<EOF
{
    "name": "$NAME",
    "file_path": "./test-data/$SANITIZED_NAME",
    "parser_version": "1.0.0",
    "date_added": "$DATE",
    "description": "Manually corrected by parsing assistant",
    "expected": {
        "headline": "$HEADLINE",
        "dateline": "$DATELINE",
        "lead_paragraph_min_length": 50,
        "quote_count": $QUOTE_COUNT
    }
}
EOF
)

# Use Python to properly append to JSON array
python3 - <<PYTHON_SCRIPT
import json
import sys

baseline_file = "$BASELINE_FILE"
new_entry = $NEW_ENTRY

try:
    with open(baseline_file, 'r') as f:
        baselines = json.load(f)
except:
    baselines = []

baselines.append(new_entry)

with open(baseline_file, 'w') as f:
    json.dump(baselines, f, indent=4)

print(f"✓ Added baseline entry to {baseline_file}")
print(f"  Total baselines: {len(baselines)}")
PYTHON_SCRIPT

# Run regression tests to verify
echo ""
echo "Running regression tests to verify..."
npm run test-regression

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Release added to regression baseline."
    echo "   File: $DEST_PATH"
    echo "   Baseline entry added"
    echo "   Total regression tests: $(python3 -c "import json; print(len(json.load(open('$BASELINE_FILE'))))")"
else
    echo ""
    echo "⚠️  WARNING: Regression test failed!"
    echo "   The baseline entry was added but tests are failing."
    echo "   Review the output above and fix any issues."
    exit 1
fi

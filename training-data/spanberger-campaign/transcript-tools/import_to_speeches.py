#!/usr/bin/env python3
"""
Import transcripts from records.jsonl into the speeches knowledgebase
Converts JSONL format to speech markdown format
"""

import json
import re
from pathlib import Path
from datetime import datetime

# Paths
RECORDS_FILE = Path(__file__).parent / 'samples' / 'records.jsonl'
SPEECHES_DIR = Path(__file__).parent.parent / 'speeches'
MANIFEST_FILE = Path(__file__).parent / 'manifest.json'

def sanitize_filename(text):
    """Create safe filename from text"""
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'\s+', '-', text)
    return text[:80].strip('-').lower()

def parse_date(date_str):
    """Try to parse date string into formatted date"""
    if not date_str:
        return None

    try:
        # Try ISO format
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%B %d, %Y')
    except:
        pass

    try:
        # Try common formats
        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%B %d, %Y']:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%B %d, %Y')
            except:
                continue
    except:
        pass

    # Return as-is if parsing fails
    return date_str

def load_manifest():
    """Load manifest to get metadata"""
    try:
        with open(MANIFEST_FILE) as f:
            return {entry['id']: entry for entry in json.load(f)}
    except:
        return {}

def import_record(record, manifest):
    """Import a single transcript record as a speech"""

    record_id = record.get('id', 'unknown')
    title = record.get('title', 'Untitled Transcript')
    content = record.get('text', '').strip()

    if not content:
        print(f"  ⚠️  Skipping {record_id}: No content")
        return None

    # Get metadata from manifest if available
    meta = manifest.get(record_id, {})

    # Extract venue/location info
    venue = None
    location = None
    date_str = record.get('date') or meta.get('date')

    # Try to infer location from title or metadata
    if 'topics' in meta:
        topics = meta['topics']
        if any('uva' in str(t).lower() or 'university' in str(t).lower() for t in topics):
            venue = "University Event"

    # Special handling for known event types
    if 'ted' in record_id.lower():
        venue = "TED Talk"
        location = "Online"
    elif 'house-ag' in record_id.lower() or 'congress' in str(meta.get('topics', [])):
        venue = "House of Representatives"
        location = "Washington, DC"
    elif 'chamber' in title.lower():
        venue = "Virginia Chamber of Commerce"
        location = "Richmond, VA"
    elif 'rally' in title.lower():
        venue = "Campaign Rally"
        location = "Virginia"
    elif 'uva' in title.lower():
        venue = "University of Virginia"
        location = "Charlottesville, VA"

    # Format date
    formatted_date = parse_date(date_str) if date_str else None

    # Create markdown filename
    filename = sanitize_filename(title)
    filepath = SPEECHES_DIR / f"{filename}.md"

    # Check if file exists
    counter = 1
    while filepath.exists():
        filepath = SPEECHES_DIR / f"{filename}-{counter}.md"
        counter += 1

    # Build markdown content
    md_content = f"# {title}\n\n"

    if venue:
        md_content += f"**{venue}**\n"

    if location or formatted_date:
        dateline_parts = []
        if location:
            dateline_parts.append(location)
        if formatted_date:
            dateline_parts.append(formatted_date)
        md_content += f"*{' — '.join(dateline_parts)}*\n"

    md_content += "\n---\n\n"

    # Add source attribution
    source_url = record.get('source_url') or meta.get('source_url')
    if source_url:
        md_content += f"**Source**: {source_url}\n\n"

    # Add content
    md_content += content.strip()
    md_content += "\n"

    # Save file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(md_content)

    return filepath

def main():
    """Main import function"""
    print("=" * 60)
    print("Transcript Import Tool")
    print("=" * 60)

    # Create speeches directory if needed
    SPEECHES_DIR.mkdir(exist_ok=True)

    # Check if records file exists
    if not RECORDS_FILE.exists():
        print(f"\n⚠️  Records file not found: {RECORDS_FILE}")
        print(f"\n💡 Steps to generate records:")
        print(f"   1. Update manifest.json with actual URLs")
        print(f"   2. cd {Path(__file__).parent}")
        print(f"   3. pip install requests beautifulsoup4 youtube-transcript-api")
        print(f"   4. python3 fetch_and_extract.py")
        print(f"   5. Run this script again")
        return

    # Load manifest
    manifest = load_manifest()
    print(f"\n📋 Loaded manifest with {len(manifest)} entries")

    # Read records
    records = []
    try:
        with open(RECORDS_FILE) as f:
            for line in f:
                line = line.strip()
                if line:
                    records.append(json.loads(line))
    except Exception as e:
        print(f"\n❌ Error reading records: {e}")
        return

    print(f"📄 Found {len(records)} transcript records")

    if not records:
        print(f"\n⚠️  No records found in {RECORDS_FILE}")
        print(f"\n💡 Run fetch_and_extract.py first to generate transcripts")
        return

    # Import each record
    imported = []
    skipped = []

    for record in records:
        record_id = record.get('id', 'unknown')
        print(f"\n📝 Importing: {record_id}")

        try:
            filepath = import_record(record, manifest)
            if filepath:
                imported.append(filepath)
                print(f"   ✅ Saved: {filepath.name}")
            else:
                skipped.append(record_id)
        except Exception as e:
            print(f"   ❌ Error: {e}")
            skipped.append(record_id)

    # Summary
    print("\n" + "=" * 60)
    print(f"✅ Successfully imported: {len(imported)} speeches")
    if skipped:
        print(f"⚠️  Skipped: {len(skipped)} records")

    print(f"\n📁 Speeches saved to: {SPEECHES_DIR}")

    # Remind to regenerate index
    print("\n💡 Next steps:")
    print("   1. cd /Users/edf/Polis/training-data/spanberger-campaign")
    print("   2. python3 generate_speech_index.py")
    print("   3. View at http://localhost:8888/speeches/")

if __name__ == '__main__':
    main()

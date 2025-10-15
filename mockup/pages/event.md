# Event — Rally with Emma Carter

**Route**: `/events/rally-oakland`
**Type**: `Event` (schema.org)
**Status**: 🟡 Draft — 1 error, 0 warnings

---

## ✅ Editor Checklist

| Status | Field | Issue |
|--------|-------|-------|
| ❌ | `location.address` | Missing street address |
| ✅ | `name` | Event title present |
| ✅ | `startDate` / `endDate` | Valid timestamps |
| ✅ | `eventStatus` | Set to Scheduled |
| ✅ | `offers.url` | RSVP link present |
| ✅ | `organizer` | Campaign set as organizer |
| ✅ | `performer` | Emma Carter listed |

---

## 📍 Prose → JSON-LD Mapping

| Where in Prose | JSON-LD Field | Notes |
|----------------|---------------|-------|
| Event page headline | `name` | ✅ "Rally with Emma Carter in Oakland" |
| Date/time | `startDate`, `endDate` | ✅ Oct 20, 2-4pm |
| Venue name | `location.name` | ✅ Jack London Square |
| Venue address | `location.address` | ❌ Missing full address |
| RSVP button | `offers.url` | ✅ Linked |
| "Free event" | `offers.price` | ✅ Set to "0" |
| Speaker | `performer` | ✅ Emma Carter |

---

## 📝 Annotated JSONC

```jsonc
{
  "@context": "https://schema.org",
  "@type": "Event",
  "@id": "https://emmacarterforcongress.org/events/rally-oakland",

  // Event details
  "name": "Rally with Emma Carter in Oakland",  // ✅
  "eventStatus": "https://schema.org/EventScheduled",  // ✅
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",  // ✅ In-person

  // Timing
  "startDate": "2025-10-20T14:00:00-07:00",  // ✅ 2:00 PM PT
  "endDate": "2025-10-20T16:00:00-07:00",    // ✅ 4:00 PM PT

  // Location
  "location": {
    "@type": "Place",
    "name": "Jack London Square",  // ✅
    "address": ""  // ❌ MISSING: Need full street address for GPS/maps
  },

  // Organization
  "organizer": {
    "@type": "Organization",
    "name": "Emma Carter for Congress"  // ✅
  },
  "performer": {
    "@type": "Person",
    "name": "Emma Carter"  // ✅
  },

  // RSVP / ticketing
  "offers": {
    "@type": "Offer",
    "url": "https://emmacarterforcongress.org/rsvp/rally-oakland",  // ✅
    "price": "0",  // ✅ Free
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"  // ✅ Spots available
  }
}
```

---

## 📦 Production JSON

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "@id": "https://emmacarterforcongress.org/events/rally-oakland",
  "name": "Rally with Emma Carter in Oakland",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "startDate": "2025-10-20T14:00:00-07:00",
  "endDate": "2025-10-20T16:00:00-07:00",
  "location": {
    "@type": "Place",
    "name": "Jack London Square",
    "address": ""
  },
  "organizer": { "@type": "Organization", "name": "Emma Carter for Congress" },
  "performer": { "@type": "Person", "name": "Emma Carter" },
  "offers": {
    "@type": "Offer",
    "url": "https://emmacarterforcongress.org/rsvp/rally-oakland",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

---

## 🔍 Validation Results

### ❌ Errors (must fix)
- `location.address`: Empty value — Google requires full address for event rich results

### ⚠️ Warnings (nice to fix)
- None

**Status**: ❌ Cannot publish until 1 error is resolved

---

## 🔧 JSON Patch Preview

```json
[
  {
    "op": "replace",
    "path": "/location/address",
    "value": {
      "@type": "PostalAddress",
      "streetAddress": "55 Harrison St",
      "addressLocality": "Oakland",
      "addressRegion": "CA",
      "postalCode": "94607",
      "addressCountry": "US"
    }
  }
]
```

---

## 📖 Editor Notes

### Why this matters for AI:
- **Full address** → Enables "events near me" queries and map integration
- **Structured timing** → AI can answer "when is the rally?"
- **Free/ticketing** → Clear RSVP info for supporters
- **eventStatus** → Can mark as Cancelled, Postponed, or Rescheduled

### Next steps:
1. Get full street address for Jack London Square venue
2. Use PostalAddress format (see JSON Patch)
3. Update if event is cancelled or moved

### Event status options:
- `EventScheduled` → Happening as planned ✅
- `EventPostponed` → New date TBD
- `EventRescheduled` → New date set
- `EventCancelled` → Not happening

---

**Last updated**: 2025-10-14

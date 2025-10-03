# Fact-Checking API Documentation

## Base URL

```
http://localhost:3001/api/fact-checking
```

All endpoints require authentication via Bearer token.

---

## Authentication

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

Get a token via the login endpoint:

```javascript
POST /api/auth/login
{
  "email": "your-email@campaign.com",
  "password": "your-password"
}
```

---

## Endpoints

### 1. Create Fact-Check

Create a new fact-check record.

**Endpoint:** `POST /create`

**Request Body:**
```json
{
  "content": "Text to fact-check (required)",
  "assignmentId": "optional-assignment-id",
  "sourceAssignmentId": "optional-source-assignment-id"
}
```

**Response:**
```json
{
  "success": true,
  "factCheckId": "FC-2025-001234",
  "message": "Fact-check created successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/fact-checking/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "According to FBI statistics, crime has decreased by 15% over the past two years."
  }'
```

---

### 2. Extract Claims

Automatically extract claims from fact-check content using AI.

**Endpoint:** `POST /:id/extract-claims`

**Parameters:**
- `id` (path) - Fact-check ID (e.g., FC-2025-001234)

**Response:**
```json
{
  "success": true,
  "claimsExtracted": 3,
  "claims": [
    {
      "id": 1,
      "text": "According to FBI statistics, crime has decreased by 15%",
      "claimType": "direct_factual",
      "verifiable": true,
      "verificationType": "standard",
      "confidence": 0.95,
      "patterns": ["factual_statement"],
      "deniabilityScore": 0.0
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/fact-checking/FC-2025-001234/extract-claims \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Fact-Check Details

Retrieve complete fact-check with all claims and verifications.

**Endpoint:** `GET /:id`

**Parameters:**
- `id` (path) - Fact-check ID

**Response:**
```json
{
  "factCheck": {
    "id": "FC-2025-001234",
    "content": "Full text being fact-checked...",
    "status": "in_progress",
    "created_at": "2025-10-02T12:00:00Z",
    "created_by": 10,
    "created_by_name": "Dr. James Wilson",
    "assigned_to": 11,
    "assigned_to_name": "Lisa Zhang",
    "completed_at": null,
    "overall_rating": null
  },
  "claims": [
    {
      "id": 1,
      "fact_check_id": "FC-2025-001234",
      "claim_text": "Crime decreased by 15%",
      "claim_type": "direct_factual",
      "status": "verified",
      "verifications": [
        {
          "id": 1,
          "verification_status": "verified_true",
          "rating": "true",
          "verified_by_name": "Lisa Zhang",
          "verified_at": "2025-10-02T12:30:00Z",
          "sources": [
            {
              "url": "https://ucr.fbi.gov/...",
              "domain": "fbi.gov",
              "credibility_tier": "federal_government",
              "credibility_score": 1.0,
              "supports_claim": true
            }
          ]
        }
      ]
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3001/api/fact-checking/FC-2025-001234 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Fact-Check

Update fact-check status, assignment, or notes.

**Endpoint:** `PATCH /:id`

**Parameters:**
- `id` (path) - Fact-check ID

**Request Body:**
```json
{
  "status": "in_progress",
  "assignedTo": 11,
  "overallRating": "mostly_true",
  "notes": "Additional context..."
}
```

**All fields are optional. Only include fields to update.**

**Response:**
```json
{
  "success": true,
  "message": "Fact-check updated"
}
```

**Status Values:**
- `pending` - Initial state
- `extracting_claims` - AI extraction in progress
- `in_progress` - Assigned and being worked on
- `completed` - Verification complete
- `published` - Results published

**Example:**
```bash
curl -X PATCH http://localhost:3001/api/fact-checking/FC-2025-001234 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assignedTo": 11
  }'
```

---

### 5. Verify Claim

Add verification for a specific claim.

**Endpoint:** `POST /:factCheckId/claims/:claimId/verify`

**Parameters:**
- `factCheckId` (path) - Fact-check ID
- `claimId` (path) - Claim ID (integer)

**Request Body:**
```json
{
  "status": "verified_true",
  "rating": "true",
  "notes": "Confirmed via FBI UCR data for 2023-2024",
  "method": "manual_source_check",
  "timeSpent": 300,
  "sources": [
    {
      "url": "https://ucr.fbi.gov/crime-in-the-u.s/2024/preliminary",
      "domain": "fbi.gov",
      "title": "FBI Uniform Crime Report 2024 Preliminary Data",
      "credibilityTier": "federal_government",
      "credibilityScore": 1.0,
      "supportsClaim": true,
      "relevanceScore": 0.95,
      "excerpt": "Total crime in District 12 decreased 15.2% from 2023 to 2024"
    }
  ]
}
```

**Field Descriptions:**
- `status` - Verification status (verified_true, verified_false, etc.)
- `rating` - Truth rating (true, mostly_true, mixed, mostly_false, false, unverifiable)
- `notes` - Fact-checker notes
- `method` - Verification method (manual_source_check, automated, etc.)
- `timeSpent` - Seconds spent on verification
- `sources` - Array of source objects

**Response:**
```json
{
  "success": true,
  "verificationId": 1,
  "message": "Claim verified successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/fact-checking/FC-2025-001234/claims/2/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified_true",
    "rating": "true",
    "notes": "Confirmed via FBI data",
    "timeSpent": 300,
    "sources": [{
      "url": "https://ucr.fbi.gov/...",
      "domain": "fbi.gov",
      "credibilityTier": "federal_government",
      "credibilityScore": 1.0,
      "supportsClaim": true
    }]
  }'
```

---

### 6. Get Fact-Checks for Assignment

Retrieve all fact-checks related to a specific assignment.

**Endpoint:** `GET /assignment/:assignmentId`

**Parameters:**
- `assignmentId` (path) - Assignment ID

**Response:**
```json
[
  {
    "id": "FC-2025-001234",
    "status": "completed",
    "created_by_name": "Dr. James Wilson",
    "assigned_to_name": "Lisa Zhang",
    "claim_count": 5,
    "verified_count": 5,
    "created_at": "2025-10-02T12:00:00Z"
  }
]
```

**Example:**
```bash
curl http://localhost:3001/api/fact-checking/assignment/A-2024-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7. Get Claim Types

Retrieve reference data for claim types.

**Endpoint:** `GET /meta/claim-types`

**Response:**
```json
[
  {
    "id": 1,
    "type_name": "direct_factual",
    "verification_approach": "standard",
    "description": "Direct factual claims that can be verified against public sources",
    "requires_sources": true,
    "typical_verification_time": 300
  },
  {
    "id": 2,
    "type_name": "private_data",
    "verification_approach": "unverifiable",
    "description": "Claims based on private data not accessible to independent verification",
    "requires_sources": false,
    "typical_verification_time": 60
  }
]
```

**Example:**
```bash
curl http://localhost:3001/api/fact-checking/meta/claim-types \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. Get Pending Fact-Checks

Retrieve all fact-checks needing attention.

**Endpoint:** `GET /pending/all`

**Response:**
```json
[
  {
    "id": "FC-2025-001234",
    "status": "pending",
    "created_by_name": "Dr. James Wilson",
    "claim_count": 3,
    "pending_count": 3,
    "created_at": "2025-10-02T12:00:00Z"
  }
]
```

**Example:**
```bash
curl http://localhost:3001/api/fact-checking/pending/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Content is required"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**404 Not Found:**
```json
{
  "error": "Fact-check not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create fact-check"
}
```

---

## Data Models

### Fact-Check Object

```typescript
{
  id: string,                    // e.g., "FC-2025-001234"
  assignment_id: string | null,
  source_assignment_id: string | null,
  content: string,
  claims_to_verify: string | null,  // JSON string
  verified_claims: string | null,   // JSON string
  disputed_claims: string | null,   // JSON string
  sources: string | null,           // JSON string
  overall_rating: string | null,
  status: string,                   // pending, in_progress, completed
  assigned_to: number | null,
  created_by: number,
  completed_by: number | null,
  fact_checker_notes: string | null,
  created_at: datetime,
  completed_at: datetime | null
}
```

### Claim Object

```typescript
{
  id: number,
  fact_check_id: string,
  claim_text: string,
  claim_type: string,              // direct_factual, hearsay, etc.
  sentence_index: number,
  span_start: number,
  span_end: number,
  verifiable: boolean,
  verification_type: string,       // standard, two-step, etc.
  confidence_score: number,        // 0.0 to 1.0
  patterns_matched: string,        // JSON array
  deniability_score: number | null,
  hearsay_confidence: number | null,
  private_data_detected: boolean,
  status: string,                  // pending, verified, disputed, flagged
  priority: string,                // low, medium, high, urgent
  created_at: datetime,
  updated_at: datetime
}
```

### Verification Object

```typescript
{
  id: number,
  claim_id: number,
  verification_status: string,     // verified_true, verified_false, etc.
  rating: string | null,           // true, mostly_true, mixed, etc.
  credibility_score: number | null,
  sources_found: string | null,    // JSON array
  verification_method: string | null,
  verification_notes: string | null,
  verified_by: number | null,
  verified_at: datetime | null,
  time_spent_seconds: number | null,
  created_at: datetime
}
```

### Source Object

```typescript
{
  id: number,
  verification_id: number,
  url: string,
  domain: string | null,
  title: string | null,
  credibility_tier: string | null,
  credibility_score: number | null,
  supports_claim: boolean | null,
  relevance_score: number | null,
  excerpt: string | null,
  date_published: datetime | null,
  date_accessed: datetime,
  notes: string | null
}
```

---

## Rate Limits

- Standard endpoints: 100 requests per minute
- Claim extraction (AI): 10 requests per minute

---

## Best Practices

1. **Always extract claims** before manual verification
2. **Include sources** for all verifiable claims
3. **Document time spent** for analytics
4. **Use credibility tiers** from tier1_sources.json
5. **Mark unverifiable** claims appropriately (don't rate as false)

---

## Related Documentation

- **User Guide:** [FACT_CHECKING_GUIDE.md](./FACT_CHECKING_GUIDE.md)
- **Database Schema:** [FACT_CHECKING_DATABASE.md](./FACT_CHECKING_DATABASE.md)
- **Source Credibility:** [tier1_sources.json](./tier1_sources.json)

---

**Last Updated:** October 2, 2025

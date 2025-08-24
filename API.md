# Cone Counter API Documentation

This document describes the REST API endpoints for the Cone Counter application.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `http://your-domain:3000`

## Authentication

All API endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Response Format

All API responses are in JSON format. Successful responses include the requested data, while error responses include an `error` field with a descriptive message.

### Success Response
```json
{
  "id": "firestore-doc-id",
  "timestamp": "2025-01-20T09:16:00.000Z",
  "date": "2025-01-20",
  "time": "09:16:00",
  "dayOfWeek": "Monday",
  "notes": "Morning cone",
  "createdAt": "2025-01-20T20:36:32.000Z",
  "updatedAt": "2025-01-20T20:36:32.000Z"
}
```

### Error Response
```json
{
  "error": "Failed to fetch cone",
  "details": "Detailed error message"
}
```

## Cone Endpoints

### Get All Cones

**GET** `/api/cones`

Retrieves all cones for the authenticated user, ordered by timestamp (newest first).

**Response:**
```json
[
  {
    "id": "firestore-doc-id",
    "timestamp": "2025-01-20T09:16:00.000Z",
    "date": "2025-01-20",
    "time": "09:16:00",
    "dayOfWeek": "Monday",
    "notes": "Morning cone",
    "createdAt": "2025-01-20T20:36:32.000Z",
    "updatedAt": "2025-01-20T20:36:32.000Z"
  }
]
```

### Get Cone by ID

**GET** `/api/cones/:id`

Retrieves a specific cone by its ID.

**Parameters:**
- `id` (path): Cone ID (Firestore document ID)

**Response:**
```json
{
  "id": "firestore-doc-id",
  "timestamp": "2025-01-20T09:16:00.000Z",
  "date": "2025-01-20",
  "time": "09:16:00",
  "dayOfWeek": "Monday",
  "notes": "Morning cone",
  "createdAt": "2025-01-20T20:36:32.000Z",
  "updatedAt": "2025-01-20T20:36:32.000Z"
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)
- `404`: Cone not found
- `500`: Server error

### Add New Cone

**POST** `/api/cones`

Creates a new cone entry for the authenticated user.

**Request Body:**
```json
{
  "timestamp": "2025-01-20T09:16:00.000Z",  // Optional, defaults to current time
  "notes": "Optional notes about this cone"   // Optional
}
```

**Notes:**
- If `timestamp` is not provided, the current time will be used
- `timestamp` should be in ISO 8601 format
- The server automatically derives `date`, `time`, and `dayOfWeek` from the timestamp in local time
- The cone is automatically associated with the authenticated user

**Response:**
```json
{
  "id": "firestore-doc-id",
  "timestamp": "2025-01-20T09:16:00.000Z",
  "date": "2025-01-20",
  "time": "09:16:00",
  "dayOfWeek": "Monday",
  "notes": "Optional notes about this cone",
  "createdAt": "2025-01-20T20:36:32.000Z",
  "updatedAt": "2025-01-20T20:36:32.000Z"
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)
- `400`: Invalid request data
- `500`: Server error

### Update Cone

**PUT** `/api/cones/:id`

Updates an existing cone entry.

**Parameters:**
- `id` (path): Cone ID (Firestore document ID)

**Request Body:**
```json
{
  "timestamp": "2025-01-20T10:00:00.000Z",  // Optional
  "notes": "Updated notes"                    // Optional
}
```

**Notes:**
- Only provide the fields you want to update
- If `timestamp` is updated, `date`, `time`, and `dayOfWeek` are automatically recalculated
- `updatedAt` is automatically set to the current time
- Users can only update their own cones

**Response:**
```json
{
  "id": "firestore-doc-id",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "date": "2025-01-20",
  "time": "10:00:00",
  "dayOfWeek": "Monday",
  "notes": "Updated notes",
  "createdAt": "2025-01-20T20:36:32.000Z",
  "updatedAt": "2025-01-20T21:00:00.000Z"
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)
- `404`: Cone not found
- `400`: Invalid update data
- `500`: Server error

### Delete Cone

**DELETE** `/api/cones/:id`

Deletes a cone entry.

**Parameters:**
- `id` (path): Cone ID (Firestore document ID)

**Response:**
```json
{
  "message": "Cone deleted successfully"
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)
- `404`: Cone not found
- `500`: Server error

### Get Cones by Date Range

**GET** `/api/cones/range/:start/:end`

Retrieves cones within a specific date range for the authenticated user.

**Parameters:**
- `start` (path): Start date in YYYY-MM-DD format
- `end` (path): End date in YYYY-MM-DD format

**Response:**
```json
[
  {
    "id": "firestore-doc-id",
    "timestamp": "2025-01-20T09:16:00.000Z",
    "date": "2025-01-20",
    "time": "09:16:00",
    "dayOfWeek": "Monday",
    "notes": "Morning cone",
    "createdAt": "2025-01-20T20:36:32.000Z",
    "updatedAt": "2025-01-20T20:36:32.000Z"
  }
]
```

## Analytics Endpoints

### Get Statistics

**GET** `/api/stats`

Retrieves comprehensive usage statistics for the authenticated user.

**Response:**
```json
{
  "total": 150,
  "today": 3,
  "thisWeek": 12,
  "thisMonth": 45,
  "averagePerDay": 2.5,
  "averagePerWeek": 17.5,
  "averagePerMonth": 75.0
}
```

**Notes:**
- `today`, `thisWeek`, and `thisMonth` are calculated using local dates
- Week starts on Monday
- Averages are calculated from the first data entry to today

### Get Time Analysis

**GET** `/api/analysis`

Retrieves detailed time-based analysis for charts and trends for the authenticated user.

**Response:**
```json
{
  "hourOfDay": {
    "9": 15,
    "10": 12,
    "14": 8,
    "20": 25
  },
  "dayOfWeek": {
    "Monday": 22,
    "Tuesday": 18,
    "Wednesday": 25,
    "Thursday": 20,
    "Friday": 30,
    "Saturday": 35,
    "Sunday": 0
  },
  "monthOfYear": {
    "1": 45,
    "2": 38,
    "3": 42
  }
}
```

**Notes:**
- `hourOfDay`: Keys are 0-23, values are counts
- `dayOfWeek`: Keys are day names, values are counts
- `monthOfYear`: Keys are 1-12, values are counts

## Data Management Endpoints

### Export Data

**GET** `/api/export`

Exports all application data for the authenticated user as a JSON file.

**Response Headers:**
- `Content-Type: application/json`
- `Content-Disposition: attachment; filename="cone-counter-export.json"`

**Response Body:**
```json
{
  "cones": [
    {
      "id": "firestore-doc-id",
      "timestamp": "2025-01-20T09:16:00.000Z",
      "date": "2025-01-20",
      "time": "09:16:00",
      "dayOfWeek": "Monday",
      "notes": "Morning cone",
      "createdAt": "2025-01-20T20:36:32.000Z",
      "updatedAt": "2025-01-20T20:36:32.000Z"
    }
  ],
  "exportDate": "2025-01-20T21:00:00.000Z",
  "version": "2.0.0"
}
```

### Import Data

**POST** `/api/import`

Imports data from a previously exported file for the authenticated user.

**Request Body:**
```json
{
  "cones": [
    {
      "timestamp": "2025-01-20T09:16:00.000Z",
      "date": "2025-01-20",
      "time": "09:16:00",
      "dayOfWeek": "Monday",
      "notes": "Morning cone",
      "createdAt": "2025-01-20T20:36:32.000Z",
      "updatedAt": "2025-01-20T20:36:32.000Z"
    }
  ],
  "exportDate": "2025-01-20T21:00:00.000Z",
  "version": "2.0.0"
}
```

**Notes:**
- **Warning**: This operation replaces ALL existing data for the authenticated user
- The `id` field from exported data is ignored (new Firestore document IDs are assigned)
- All timestamps are validated and normalized
- Data is automatically associated with the authenticated user

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 1 cones!",
  "importedCount": 1
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)
- `400`: Invalid import data format
- `500`: Server error

## Timezone Handling

The API ensures consistent timezone handling:

- **Storage**: All timestamps are stored as ISO 8601 strings in UTC
- **Derived Fields**: `date`, `time`, and `dayOfWeek` are computed from local time
- **Display**: All dates and times are shown in the server's local timezone
- **Normalization**: On startup, existing data is automatically normalized to ensure consistency

### Example Timezone Behavior

```json
// Input timestamp (UTC)
"timestamp": "2025-01-20T23:30:00.000Z"

// Derived fields (local time, assuming UTC+10)
"date": "2025-01-21"      // Next day due to timezone
"time": "09:30:00"        // Local time
"dayOfWeek": "Tuesday"    // Local day
```

## Error Handling

### HTTP Status Codes

- `200`: Success
- `201`: Created (new resource)
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid or missing authentication)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

### Common Error Messages

- `"No token provided"`: Missing Authorization header
- `"Invalid token"`: Firebase token verification failed
- `"Failed to fetch cones"`: Database query failed
- `"Cone not found"`: Requested cone ID doesn't exist
- `"Failed to add cone"`: Database insertion failed
- `"Failed to update cone"`: Database update failed
- `"Invalid import data format"`: Import file is malformed

## Rate Limiting

Currently, no rate limiting is implemented. However, for production use, consider implementing rate limiting to prevent abuse.

## CORS

The API allows cross-origin requests from any origin (`Access-Control-Allow-Origin: *`). This is suitable for development but should be restricted in production.

## Testing

### Health Check

**GET** `/api/stats`

Use this endpoint to verify the API is running and responsive.

### cURL Examples

```bash
# Get all cones (requires Firebase ID token)
curl -H "Authorization: Bearer <firebase-id-token>" \
  http://localhost:3000/api/cones

# Add a new cone
curl -X POST http://localhost:3000/api/cones \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Test cone"}'

# Update a cone
curl -X PUT http://localhost:3000/api/cones/<doc-id> \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Updated notes"}'

# Delete a cone
curl -X DELETE http://localhost:3000/api/cones/<doc-id> \
  -H "Authorization: Bearer <firebase-id-token>"
```

## Additional Resources

- **Frontend Integration**: See `frontend/src/api.ts` for client-side usage
- **Database Schema**: See `src/database.ts` for Firestore structure
- **Server Implementation**: See `src/server.ts` for endpoint implementation
- **Firebase Setup**: See `FIREBASE_SETUP.md` for authentication configuration

---

**API Version**: 2.0.0  
**Last Updated**: January 2025

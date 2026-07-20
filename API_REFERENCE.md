# ComfyClient API Reference

## Overview
This API provides a frontend-agnostic interface for:
- uploading source images
- browsing one style catalog at a time
- creating style-transfer jobs against ComfyUI
- polling job status and recent history
- receiving optional websocket job events

Processed image assets returned by the backend use the original filename basename with a `.jpg` extension.

## Runtime Topology
- Frontend (React) runs in Docker
- Backend API runs in Docker
- Both use the same `docker-compose` stack/network
- ComfyUI runs on the host OS outside Docker

### Frontend Request Routing
The browser should call the frontend origin with relative URLs like `/api/...`, `/storage/...`, and `/style-assets/...`.
In Docker, the frontend container proxies those paths to the backend service name on the compose network.
This avoids exposing Docker service DNS names directly to the browser.

### Comfy Connectivity
Backend must use a configurable Comfy upstream URL (do not hardcode `localhost` inside containers).
Recommended local default for Docker Desktop:
- `COMFY_API_URL=http://host.docker.internal:8188`
- `COMFY_WS_URL=ws://host.docker.internal:8188/ws`

For Linux hosts where `host.docker.internal` is unavailable, the compose file should map the host gateway explicitly or inject a host IP through environment.

## Base URL
`/api`

## Session Model
Anonymous session token model. Backend issues or accepts `session_token` to scope recent jobs per device/session.

## Common Error Shape
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": null
  }
}
```

## Asset URL Rules
- Style thumbnails: `/style-assets/thumbnails/...`
- Uploaded images: `/storage/uploads/...`
- Generated images: `/storage/generated/...`
- Generated thumbnails: `/storage/thumbnails/...`

## Endpoints

### POST /api/uploads
Upload a source image and persist it as canonical backend JPEG.

Request: `multipart/form-data`
- `image` (required)
- `session_token` (optional)

Success response example:
```json
{
  "upload_id": "upl_123",
  "session_token": "sess_abc",
  "original_filename": "photo.png",
  "stored_filename": "photo.jpg",
  "mime_type": "image/jpeg",
  "local_url": "/storage/uploads/photo.jpg",
  "thumbnail_url": "/storage/thumbnails/thumb_photo.jpg"
}
```

### GET /api/styles/catalogs
List available style catalogs.

Success response example:
```json
{
  "catalogs": [
    {
      "id": "fooocus",
      "label": "Fooocus",
      "style_count": 275,
      "default": true
    }
  ]
}
```

### GET /api/styles?catalog={catalogId}
Return styles for exactly one catalog.

Success response example:
```json
{
  "catalog": {
    "id": "sd-france",
    "label": "Sd France"
  },
  "styles": [
    {
      "id": "3d-character",
      "catalog": "sd-france",
      "name": "3D Character",
      "prompt": "...",
      "negative_prompt": "...",
      "thumbnail_url": "/style-assets/thumbnails/sd-france_3D-Character_00001_.jpg"
    }
  ]
}
```

### POST /api/jobs/style-transfer
Create a style-transfer job.

Request JSON:
```json
{
  "session_token": "sess_abc",
  "upload_id": "upl_123",
  "catalog": "sd-france",
  "style_id": "3d-character"
}
```

Success response example:
```json
{
  "job_id": "job_123",
  "session_token": "sess_abc",
  "status": "queued",
  "upload": {
    "upload_id": "upl_123",
    "stored_filename": "photo.jpg",
    "local_url": "/storage/uploads/photo.jpg"
  },
  "style": {
    "catalog": "sd-france",
    "id": "3d-character",
    "name": "3D Character"
  },
  "prompt": {
    "upstream_prompt_id": "comfy_prompt_123",
    "upstream_client_id": "backend_generated_uuid"
  },
  "result": null,
  "error": null
}
```

### GET /api/jobs/{jobId}
Fetch current state of a job.

Behavior:
- Reconciles non-terminal jobs against upstream Comfy execution updates/history before returning.
- Completed jobs include backend-owned result URLs in `result`.

### GET /api/jobs/recent
Return recent jobs for active session.

Behavior:
- Reconciles recent non-terminal jobs before response so manual refresh reflects upstream completion.

Session token may be provided via:
- query: `session_token`
- header: `x-session-token`

### GET /api/ws?session_token={token}
Optional websocket endpoint for normalized `job.*` events.

## Naming Rules
- Processed uploads and generated results are returned as JPEG
- Stored filename format: original basename + `.jpg`
- Clients must use backend-provided filename and URLs

## Docker Checklist
- Frontend can resolve backend service by compose DNS name
- Backend can resolve ComfyUI host endpoint from container
- Full upload -> style -> job -> result flow succeeds
- Mounted backend volumes persist assets across restarts
- Browser uses same-origin relative paths while the frontend container proxies to the backend service

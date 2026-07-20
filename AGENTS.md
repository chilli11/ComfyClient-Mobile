# AGENTS.md

## Purpose
This repository contains a mobile-first ComfyUI style-transfer application split into:
- Backend API service (Node.js/Express)
- Frontend mobile web app (React + Vite)

The backend is the system boundary. Frontend code must use backend endpoints only and must not depend on raw ComfyUI graph details.

## Current Repository Context
- Repository: `chilli11/ComfyClient-Mobile`
- Default branch: `main`
- Initial commit created in this workspace and pushed to GitHub.

## Product Goal
Provide a simple mobile flow:
1. Upload image
2. Choose style catalog
3. Choose style
4. Submit style-transfer job
5. Track status and view result

## Architectural Rules
1. Keep ComfyUI integration isolated behind backend services.
2. Keep frontend API-facing and workflow-agnostic.
3. Persist upload/job metadata server-side.
4. Use session-token-scoped recent history for anonymous users.
5. Return backend-owned job statuses (`queued`, `running`, `completed`, `failed`).

## Image and Naming Rules
- Canonical output format is JPEG.
- Canonical filename rule: original basename + `.jpg`.
- Apply this consistently for uploads, generated outputs, and metadata records.

## API Contract (App-facing)
- `GET /api/health`
- `GET /api/styles/catalogs`
- `GET /api/styles?catalog=<catalogId>`
- `POST /api/uploads`
- `POST /api/jobs/style-transfer`
- `GET /api/jobs/:jobId`
- `GET /api/jobs/recent`

## Workflow Template Integration
- Base template: `style-assets/Simple-Style-Changer-Flux-API.json`
- Runtime mutations should be limited to:
  - Input image node value
  - Selected style value
  - Output filename prefix/value

## Runtime and Deployment
- Frontend and backend run in Docker Compose.
- ComfyUI runs externally (host).
- Default container-to-host endpoints use `host.docker.internal` in local Docker Desktop.

## Frontend Design Direction
Use mobile-first Material principles:
- Top app bar with clear app identity
- Elevated upload/status cards
- Catalog chips for quick filtering
- Thumbnail style cards in responsive grid
- Sticky bottom primary action for submit
- Clear loading/error/empty states
- Large touch targets and one-handed usability

## Frontend Behavior Constraints
- Do not expose raw ComfyUI URLs in user-facing flows.
- Keep submit disabled until both upload and style selection are valid.
- Persist and reuse session token locally for recent-job continuity.

## Suggested Validation Steps
1. Backend starts and `GET /api/health` succeeds.
2. Catalog endpoints return normalized style data.
3. Upload endpoint stores canonical JPEG + thumbnail metadata.
4. Job submission returns local `job_id` and initial `queued` status.
5. Frontend build passes in `frontend/` with `npm run build`.
6. Docker Compose boots frontend/backend and proxy paths resolve.

## Working Agreement for Future Agents
- Prefer small, targeted edits.
- Preserve existing API contracts unless explicitly asked to change them.
- Avoid adding frontend logic that reconstructs backend workflow payloads.
- Document behavior changes in `API_REFERENCE.md` when endpoints or payloads change.
- Keep generated/runtime data out of git (`storage/`, build output, dependencies).

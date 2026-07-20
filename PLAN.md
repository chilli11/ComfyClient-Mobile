# ComfyClient Mobile Plan

## Goal
Build a mobile-first frontend and isolated backend flow for style transfer with ComfyUI, where the app-facing contract stays stable and backend-owned.

## Core Requirements
- Use a React mobile-first frontend.
- Keep backend logic isolated from frontend implementation details.
- Use the Simple-Style-Changer-Flux-API workflow template for style transfer jobs.
- Canonical file naming for image outputs: JPEG with original filename stem and .jpg extension.
- Provide clear API endpoints for upload, style selection, job submission, and job status/result retrieval.
- Run frontend and backend in Docker; ComfyUI remains an external upstream service.
- Follow ComfyUI server communication guidance using WebSocket + History as the primary completion path, with backend polling fallback.
- Keep frontend Comfy-agnostic: no raw Comfy routes, message types, or workflow payload construction in browser code.

## Architecture Plan
1. Backend contract first.
   - Public flow: upload image -> choose style -> submit job -> track status -> fetch result.
   - Keep raw ComfyUI details hidden behind backend services.
2. Workflow templating.
   - Load base workflow from style-assets/Simple-Style-Changer-Flux-API.json.
   - Mutate only runtime fields (image input, selected style, output prefix).
3. Style catalog API.
   - Serve catalog list and styles by catalog from local style-assets.
   - Return normalized style records with stable ids and thumbnail URLs.
4. Upload and storage.
   - Persist uploads as canonical JPEGs.
   - Generate thumbnails and metadata records.
5. Job orchestration.
   - Validate session, upload ownership, and style id.
   - Submit to ComfyUI through a dedicated client.
   - Persist local job records with upstream prompt id mapping and Comfy client correlation metadata.
6. Job status/result API.
   - Expose backend-owned status states: queued, running, completed, failed.
   - Reconcile non-terminal jobs against Comfy execution updates and history before returning reads.
   - Provide recent jobs per session token.
7. Deployment.
   - Docker Compose for backend + frontend.
   - Use host.docker.internal defaults for ComfyUI endpoints in local Docker Desktop.

## Comfy Communication Compliance
1. Primary pattern: Method 2 (WebSocket + History).
   - Submit prompt to Comfy via POST /prompt with backend-tracked correlation keys.
   - Monitor execution events from Comfy WebSocket endpoint (/ws) using a backend-owned client.
   - Finalize outputs by reading /history/{prompt_id}, then fetching image binaries from /view using filename, subfolder, and type.
2. Fallback behavior.
   - If websocket delivery is delayed/missed, backend read endpoints still reconcile status from history/queue checks.
3. Backend boundary.
   - Frontend interacts only with app-facing endpoints; backend translates Comfy semantics to app statuses.
4. Runtime observability.
   - Correlate logs across job_id, prompt_id, and client_id for submit, execution, history read, and result materialization.

## Job Lifecycle Semantics
- queued: accepted by backend and submitted to upstream queue.
- running: execution started or actively progressing in Comfy.
- completed: output resolved, canonical result saved, and URLs persisted.
- failed: terminal upstream validation/runtime error or interrupted execution.

## API Surface (App-facing)
- GET /api/health
- GET /api/styles/catalogs
- GET /api/styles?catalog=<catalogId>
- POST /api/uploads
- POST /api/jobs/style-transfer
- GET /api/jobs/:jobId
- GET /api/jobs/recent

## Mobile UI Design (Material Principles)

### Interaction Model
- Step 1: Upload image
- Step 2: Select catalog
- Step 3: Select style
- Step 4: Submit style-transfer job
- Step 5: Loading view while generation runs
- Step 6: Result view with current image and previous history

### Layout Spec
- Top app bar with product name and lightweight session context.
- Elevated upload card with file picker and uploaded thumbnail preview.
- Filter chip row for style catalogs.
- Scrollable style browser card that shows exactly 2 visible rows, supports horizontal scrolling, and caps thumbnails at 256x256.
- Status card for current operation feedback.
- Sticky bottom primary action button for job submission.
- Full-page loading state immediately after submit.
- Completed state that prioritizes the current result image and then lists previous jobs from session history.

### Mobile Wireframe

```text
┌────────────────────────────────────┐
│ ComfyClient        [session]       │
│ Style transfer on mobile           │
├────────────────────────────────────┤
│ Upload your image                  │
│ [ elevated upload card ]           │
│ • Tap to pick image                │
│ • Thumbnail preview                │
├────────────────────────────────────┤
│ Choose a catalog                   │
│ [ chip ] [ chip ] [ chip ]         │
│                                    │
│ Pick a style                       │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │img   │ │img   │ │img   │         │
│ │name  │ │name  │ │name  │         │
│ └──────┘ └──────┘ └──────┘         │
├────────────────────────────────────┤
│ Current status                     │
│ Uploading / Ready / Queued         │
├────────────────────────────────────┤
│ [ Submit style-transfer job ]      │
└────────────────────────────────────┘
```

### Post-Submit Views

Loading state:
- Replace workflow sections with a generation-focused screen.
- Show upload preview, selected style, current status, and progress cues.

Completed state:
- Show current generated image prominently.
- Show recent/previous jobs below with quick selection.

### Visual Direction
- Material-style hierarchy with clear elevation, shape, and spacing.
- Thumb-friendly controls and large tap targets.
- Progressive disclosure: do not show submit as primary until upload + style are selected.
- Keep error and empty states explicit and action-oriented.

## Implementation Priorities
1. Reliable completion first.
   - Implement backend status reconciliation from Comfy websocket/history so queued jobs transition correctly.
2. UX flow updates second.
   - Add submit-time full loading view and terminal result/history view.
3. Large-catalog style browsing third.
   - Add 2-row horizontal style scroller with 256x256 thumbnail cap.

## Validation Checklist
- Frontend builds successfully in Docker-targeted Vite setup.
- Backend health and API endpoints reachable through frontend proxy.
- Upload converts to canonical JPEG and preserves basename.
- Job submission returns local job_id and queued state.
- Job status transitions queued -> running -> completed/failed in both single-job and recent-job reads.
- Recent jobs refresh shows terminal states and generated result metadata.
- Post-submit loading view appears immediately and switches to result view on completion.
- Style browser supports many thumbnails while showing two rows with horizontal scroll and 256x256 max thumbnails.

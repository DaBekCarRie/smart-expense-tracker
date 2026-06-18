# Memory — Authentication Routing Guards

Last updated: 2026-06-18

## What was built

- **Root Route Guard (`frontend/app/page.tsx`)**: Converted the static redirect into a Client Component that checks user authentication status via `useQuery` mapped to the `getMe` endpoint. Shows the themed `SkeletonOverlay` during verification and redirects to `/dashboard` (if authenticated) or `/login` (if anonymous).
- **Login and Register guards (`frontend/app/(auth)/login/page.tsx`, `frontend/app/(auth)/register/page.tsx`)**: Added logic to verify authentication state, redirecting already logged-in users directly to `/dashboard` with `SkeletonOverlay` loading screens to avoid form flickering.
- **API Client Interceptor Loop Guard (`frontend/lib/api/client.ts`)**: Updated the Axios response interceptor to check the window path. Bypasses the uvicorn redirect to `/login` if the user is already on auth pages, and prevents token refresh calls for `/auth/login` and `/auth/register` endpoints.
- **Progress Log (`PROGRESS.md`)**: Updated history log with details on routing and redirect changes.

## Decisions made

- **Client-side Verification with React Query**: Leveraged the existing cache (`["user"]` key) and API interceptor system to perform check routing in Client Components. This ensures silent token refreshes and cookie verification occur correctly in context before routing actions.
- **Excluding Auth Paths from Interceptor Redirects**: Inspected `window.location.pathname` inside the client interceptor to disable the automatic `/login` redirect when the user is already loading auth pages.

## Problems solved

- **Infinite Redirect Loops**: Resolved potential infinite page reload/redirect loops that occur when unauthenticated users attempt `getMe` requests on the `/login` or `/register` pages.

## Current state

- Root route (`/`), `/login`, and `/register` pages are fully guarded, and client-side redirections are working as expected.
- All code has been written and reviewed.

## Next session starts with

- Staging and committing changes to Git (e.g. `git add`, `git commit`, `git push`).
- Starting any next milestone or feature task.

## Open questions

- None.

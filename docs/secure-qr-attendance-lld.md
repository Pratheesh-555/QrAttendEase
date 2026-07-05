# Secure QR Attendance LLD

## Goal
Use a simple, mobile-friendly QR attendance flow where the QR contains an opaque server-issued token, and the student identity comes from Google login email.

## Security Rules
- QR contents must be a short-lived opaque token, not class data or a client-side secret.
- The server must sign or hash the token and verify it before marking attendance.
- Attendance identity must use Google email as the unique key.
- Student display name is optional and may be derived from Google profile or email prefix.
- A token must expire quickly and be rotated on refresh.

## Phase 1: Tokenized QR Sessions
- Faculty starts attendance.
- Backend creates or reuses the attendance session and issues a fresh QR token.
- Frontend renders only the token string as a QR image.
- Student scans the QR and sends the token plus Google email/name to the backend.
- Backend validates the token, session state, expiry, duplicate attendance, and then stores the record.

## Phase 2: Frontend Switchover
- Replace the old AES/decrypt flow on faculty and student screens.
- Add a direct QR token refresh action that rotates the server token without restarting the attendance session.
- Keep the UI and scanner flow simple for mobile use.

## Phase 3: Hardening
- Add stronger token TTL controls and optional device or class policy checks.
- Add clearer mobile/browser compatibility messages.
- Add audit logs for issued tokens and mark attempts.

## Acceptance Criteria
- QR can be scanned on current mobile browsers.
- The QR cannot be forged by reading the frontend bundle.
- Google email is the attendance identity.
- Duplicate scans are rejected.
- Expired tokens fail cleanly.
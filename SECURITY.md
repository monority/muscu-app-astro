# Security

## Auth

Gym Empire uses a **fake dev gate** — not a real auth system.

- No password check
- No token
- No server-side validation
- Data readable by any code on same origin

**Never present this as a security boundary.**

## localStorage

All data lives in browser localStorage:

- Exercise catalog
- Sessions, sets, progress
- Body measurements
- Settings (including WebDAV credentials)

localStorage is accessible to any JavaScript on the same origin. Do not store sensitive data you wouldn't want exposed to XSS.

## WebDAV Sync

Credentials are stored in plain localStorage and sent via HTTP Basic auth to the user-configured WebDAV server.

**Tradeoffs:**
- Password is visible in browser DevTools
- No encryption at rest
- No server-side validation of the server URL

**Mitigations:**
- Credentials only sent to the configured WebDAV server
- HTTPS recommended (HTTP only for local networks)
- UI clearly warns about plain-text storage

## Recommendations

- Use a dedicated WebDAV account (not your main cloud account)
- Use HTTPS when possible
- Do not expose this app to untrusted networks
- Treat localStorage as ephemeral (backup regularly)

## Reporting

No vulnerability reporting process — this is a personal project.

# Phase 2 — Progress Tracker: State Management & Core Architecture Modernization

**Project:** AmenConnect & AmenKiosk  
**Lead Engineer:** Senior Frontend Architect & Application Security Engineer  
**Current Status:** **MILESTONE 1 (SECURITY DEBT CLOSURE & FUNCTIONAL STABILIZATION) COMPLETE**  

---

## Milestone Roadmap & Execution State

| Milestone | Scope | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Milestone 1** | **Mandatory Opening Tasks — Security Debt Closure & Stabilization**<br>• Fix QR Session Replay with atomic redemption<br>• Implement HTTP-level CSP for Client & Kiosk<br>• Verify HTTPS & Secure cookie behavior on LAN<br>• Correct customer registration Tunisian RIB/IBAN defect<br>• Deploy local Mailpit SMTP environment & test OTP flows | **COMPLETED & VERIFIED** | 30/30 automated tests passed across QR concurrency, RIB formatting, and Mailpit OTP delivery. All 7 Docker containers healthy. |
| **Milestone 2** | **Provider Consolidation & React State Management Modernization**<br>• Audit Context Provider tree & eliminate duplicate providers<br>• Implement stable Context values (`useMemo`, `useCallback`)<br>• Fix re-render cascades across Dashboard, Compte, and Kiosk | *PENDING APPROVAL* | Scheduled following review of Milestone 1. |
| **Milestone 3** | **Lifecycle Management, Cleanup & Memory Leak Elimination**<br>• Fix `useEffect` dependency arrays & missing cleanups<br>• Prevent socket.io, timer, and Leaflet map memory leaks<br>• Replace blocking `window.alert()` with Ionic toast notifications | *PENDING APPROVAL* | Scheduled following Milestone 2. |
| **Milestone 4** | **API Client Centralization & Component Architecture**<br>• Centralize fetch calls into typed, resilient API client<br>• Deduplicate shared logic between Desktop, Mobile, and Kiosk<br>• Clean up TypeScript types, remove `any`, enable clean `tsc` checks | *PENDING APPROVAL* | Scheduled following Milestone 3. |

---

## Milestone 1 Summary: Accomplishments & Evidence

### 1. Atomic Single-Use QR Redemption (`Backend/routes/qrLogin.js`)
- **Problem:** QR sessions allowed multiple token retrievals within the 60-second TTL window without marking sessions as redeemed.
- **Solution:** Replaced non-atomic find-then-update with atomic MongoDB `findOneAndUpdate({ sessionId, status: "authenticated" }, { $set: { status: "consumed", consumedAt: new Date() } })`.
- **Validation:** 15 automated test cases executed (`Backend/tests/test_qr_replay_concurrency.js`). Verified single redemption succeeds, replay returns `HTTP 409 Conflict`, and concurrent requests are atomically serialized with exactly 1 winner.

### 2. HTTP-Level Content Security Policy (`nginx.conf`)
- **Problem:** Client portal used insecure `<meta>` tag CSP with wildcard `http:`/`https:` sources; Kiosk lacked CSP completely.
- **Solution:** Emitted HTTP-level `Content-Security-Policy` via Nginx reverse proxy on both ports 8100 and 8200. Purged wildcards and restricted connect, script, style, font, and frame origins to verified banking dependencies. Added `frame-ancestors 'self'`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
- **Validation:** Inspected effective HTTP response headers via `curl -I`. Confirmed headers present on both frontends; verified sensitive paths (`/.git/config`, `/.env`, `/server.key`) return 404.

### 3. Tunisian Banking RIB & IBAN Defect Remediation (`Backend/config/helper.js` & `authController.js`)
- **Problem:** Customer registration crashed with `Error: Le RIB doit contenir exactement 20 chiffres.` because `generateAccountNumber()` produced a 9-digit number passed directly to an IBAN generator.
- **Solution:** Aligned with Banque Centrale de Tunisie banking standards and Amen Bank internal convention:
  - Bank Code: `07` (Amen Bank)
  - Agency Code: `162` (Agence Centrale)
  - Account Number: 13 digits
  - Control Key: 2 digits calculated via modulo 97 (`97 - ((RIB18 * 100) % 97)`)
  - Full RIB: 20 digits (`07162...`)
  - Tunisian IBAN: 24 characters (`TN5907162...`)
- **Validation:** 7 helper unit tests passed; real registration API `POST /api/auth/register` returned `201 Created` with valid accounts, 20-digit RIB, and 24-char IBAN confirmed in MongoDB.

### 4. Local Mailpit SMTP Integration & 2FA OTP Testing
- **Problem:** Development environment lacked an SMTP server, causing OTP email delivery to throw 500 errors.
- **Solution:** Integrated `axllent/mailpit:latest` service into `docker-compose.yml` (SMTP port 1025, Web UI & API port 8025). Configured dynamic transporter in `authController.js` and `adminAuthController.js`.
- **Validation:** 8 automated tests passed (`Backend/tests/test_mailpit_otp_flow.js`). Verified OTP emails delivered to Mailpit, parsed 6-digit codes via Mailpit REST API, rejected invalid OTP with 400, and completed successful authentication with session cookies issued for both customers and bankers.

### 5. LAN & Secure Cookie Verification
- **Solution:** Added `app.set("trust proxy", 1)` in `Backend/app.js` to ensure Express accurately detects protocol and client IP behind Nginx reverse proxies. Verified cookie security flags.

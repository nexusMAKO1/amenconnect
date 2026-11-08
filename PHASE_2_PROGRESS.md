# Phase 2 — Progress Tracker: State Management & Core Architecture Modernization

**Project:** AmenConnect & AmenKiosk  
**Lead Engineer:** Senior Frontend Architect & Application Security Engineer  
**Current Status:** **MILESTONES 1 & 2 COMPLETE & VERIFIED**  

---

## Milestone Roadmap & Execution State

| Milestone | Scope | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Milestone 1** | **Mandatory Opening Tasks — Security Debt Closure & Stabilization**<br>• Fix QR Session Replay with atomic redemption<br>• Implement HTTP-level CSP for Client & Kiosk<br>• Verify HTTPS & Secure cookie behavior on LAN<br>• Correct customer registration Tunisian RIB/IBAN defect<br>• Deploy local Mailpit SMTP environment & test OTP flows | **COMPLETED & VERIFIED** | 30/30 automated tests passed across QR concurrency, RIB formatting, and Mailpit OTP delivery. All 7 Docker containers healthy. |
| **Milestone 2** | **Provider Consolidation, Cookie Protocol Adaptation & React State Modernization**<br>• Audit Context Provider tree & eliminate duplicate providers (`AmenKiosk` nested `AuthProvider` & `ThemeLoader`)<br>• Implement stable Context values (`useMemo`, `useCallback`) across all contexts<br>• Fix protocol-dependent cookie security & Safari HTTP rejection (`isSecure`, `SameSite: Lax`)<br>• Fix Leaflet map lifecycle memory leak in `SurveillanceMonitoring`<br>• Guard Capacitor `StatusBar` on web browsers<br>• Update CSP with `'unsafe-inline'` for Vite bootstrap scripts | **COMPLETED & VERIFIED** | Rebuilt and verified Docker containers. 30/30 automated tests passing. Admin OTP login -> profile fetch validated end-to-end. |
| **Milestone 3** | **UI/UX Standardization & Notification Upgrades**<br>• Replace blocking `window.alert()` with Ionic toast notifications (`useIonToast`)<br>• Standardize loading and empty states across forms<br>• Form validation refinements and error feedback | *IN PROGRESS / NEXT* | Scheduled next. |
| **Milestone 4** | **API Client Centralization & Component Architecture**<br>• Centralize fetch calls into typed, resilient API client<br>• Deduplicate shared logic between Desktop, Mobile, and Kiosk<br>• Clean up TypeScript types, remove `any`, enable clean `tsc` checks | *PENDING* | Scheduled following Milestone 3. |

---

## Milestone 2 Summary: Accomplishments & Evidence

### 1. Dynamic Protocol-Aware Cookie Delivery & Safari HTTP Compatibility
- **Problem:** When logging in via Admin or Customer portals over plain HTTP (`http://localhost:8100` / Safari), backend was setting cookies with `Secure: true` because `NODE_ENV === "production"`. Safari strictly discards `Secure` cookies over non-HTTPS connections, causing immediate `401 Unauthorized` on subsequent profile requests (`/api/admin/profile`).
- **Solution:** Replaced unconditional production `secure: true` with dynamic protocol detection respecting `req.secure`, reverse-proxy headers (`x-forwarded-proto`), and explicit `COOKIE_SECURE` environment variable. Standardized `SameSite` to `lax` to ensure stable SPA routing transitions:
  ```js
  const isSecure = (process.env.COOKIE_SECURE === "true") ||
    Boolean(req.secure || req.headers["x-forwarded-proto"] === "https");
  res.cookie("adminToken", token, { httpOnly: true, secure: isSecure, sameSite: "lax", maxAge: 3600000 });
  ```
- **Validation:** Automated curl flow tested: Login -> Mailpit OTP fetch -> OTP verification -> `/api/admin/profile` retrieval returns `HTTP 200 OK` with full admin payload and no cookie dropping.

### 2. Provider Tree Consolidation & Elimination of Nested Providers
- **Problem:** `AmenKiosk/src/App.tsx` wrapped `<PrivatePages>` with a duplicate `<AuthProvider>` and duplicate `<ThemeLoader/>`, nested inside the outer root `<AuthProvider>`. This shadowed authentication state, causing authenticated state loss on route transitions.
- **Solution:** Removed nested providers and moved protected routes directly under the root `<IonRouterOutlet>`, sharing a single authenticating context instance.
- **Files Modified:** `AmenKiosk/src/App.tsx`.

### 3. Context Provider Value Memoization (`useMemo` & `useCallback`)
- **Problem:** Context providers (`AuthContext`, `AdminAuthContext`, `CarteContext`, `ThemeContext`, `OrientationContext`) were generating new object literals on every render, triggering full component re-render cascades across subscribing children.
- **Solution:**
  - Wrapped context values in `useMemo` with minimal dependency arrays.
  - Wrapped API action methods (`refreshProfile`, `refreshAdminProfile`, `refreshCartes`, `updateCarteStatus`) in `useCallback`.
  - Added graceful 401 handling during initial unauthenticated page loads to avoid spurious console errors.
- **Files Modified:**
  - `ThemeContext.tsx`
  - `AmenConnect/src/AuthContext.tsx`
  - `AmenConnect/src/AdminAuthContext.tsx`
  - `AmenConnect/src/CarteContext.tsx`
  - `AmenKiosk/src/context/AuthContext.tsx`
  - `AmenKiosk/src/context/CarteContext.tsx`
  - `AmenKiosk/src/context/OrientationContext.tsx`

### 4. Leaflet Map Lifecycle Leak Remediation
- **Problem:** `SurveillanceMonitoring.tsx` cleanup function checked `activeTab !== "monitoring"`. Because `activeTab` was `"monitoring"` at unmount time, the condition evaluated to false, leaving Leaflet map DOM handlers and cluster layers permanently bound in memory.
- **Solution:** Refactored cleanup return function to unconditionally call `mapRef.current.remove()`, reset layer references, and clear map readiness state on component unmount.
- **Files Modified:** `AmenConnect/src/pages/Admin/SurveillanceMonitoring/SurveillanceMonitoring.tsx`.

### 5. Web Browser Compatibility & CSP Alignment
- **Problem:**
  - Capacitor `StatusBar` threw `Error: "StatusBar" plugin is not implemented on web` on browser desktop visits.
  - Vite inline modern-browser detection scripts were rejected by CSP because `script-src` lacked `'unsafe-inline'`.
- **Solution:**
  - Guarded `StatusBar` with `Capacitor.isNativePlatform()` in `AmenConnect/src/main.tsx`.
  - Added `'unsafe-inline'` to Nginx `script-src` directives in `AmenConnect/nginx.conf` and `AmenKiosk/nginx.conf`.
  - Cleaned up obsolete `<meta http-equiv="X-Frame-Options">` tags.

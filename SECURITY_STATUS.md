# Security Status

**Review date:** 2026-08-25  
**Scope:** HTTPS/TLS configuration, serverless API routes, authentication/session handling, Supabase RLS/storage policies, secrets, and dependency health.  
**Overall status:** **NOT READY FOR PRODUCTION**

## Executive Summary

The application builds and lints successfully, and the production dependency audit reports no known vulnerabilities. The main security blockers are authorization and database policy issues: the browser uses the public Supabase anon key for write operations, the SQL grants anonymous write/delete access to most content tables and storage buckets, appointment records are publicly readable, and the Cloudinary upload/delete API routes do not require an admin session.

HTTPS is used for configured external services and the session cookie is marked `Secure`, but this repository does not prove that the deployed hostname redirects HTTP to HTTPS or that security response headers are configured. Those deployment controls must be verified in Vercel or the production host.

## Findings

### Critical: Anonymous users can modify the database

The SQL scripts enable RLS but then create `anon` insert, update, and delete policies with `using (true)` / `with check (true)` for clinic information and the content tables. The frontend directly calls Supabase with the anon key for these operations. Anyone who obtains the public site configuration can therefore alter or delete clinic content without logging in.

Affected policy scripts include:

- [clinic_information.sql](supabase/clinic_information.sql#L44-L61)
- [services.sql](supabase/services.sql#L31-L45)
- [awards.sql](supabase/awards.sql#L31-L45)
- [doctors.sql](supabase/doctors.sql#L37-L51)
- [management_team.sql](supabase/management_team.sql#L33-L47)
- [mission_vision_core.sql](supabase/mission_vision_core.sql#L37-L47)
- [medical_packages.sql](supabase/medical_packages.sql#L21-L32)
- [promotions.sql](supabase/promotions.sql#L22-L33)
- [blog_posts.sql](supabase/blog_posts.sql#L40-L51)
- [corporate.sql](supabase/corporate.sql#L31-L42)

**Required fix:** remove anonymous write/delete policies. Route admin CRUD through authenticated server APIs using the service-role key, or implement a real Supabase Auth authenticated role and grant writes only to that role. Keep only the minimum public `select` policies required by the public website.

### Critical: Patient appointments are publicly readable and mutable

[appointments.sql](supabase/appointments.sql#L20-L27) grants the `anon` role select, update, and delete access to all appointment rows. This exposes patient names, ages, addresses, phone numbers, reasons, doctors, and dates, and allows any anonymous caller to change or delete them.

**Required fix:** allow anonymous insert only if public appointment submission is required. Remove anonymous select/update/delete policies and expose appointment management only through an authenticated admin API. Review whether the address, reason, and other patient data need retention and access logging.

### High: Cloudinary upload and delete endpoints are unauthenticated

[cloudinary-upload.js](api/cloudinary-upload.js#L4-L35) accepts any POST request and uploads to the configured Cloudinary account. [cloudinary-delete.js](api/cloudinary-delete.js#L3-L22) accepts any POST request containing an image URL and attempts deletion. Neither route calls `requireAdmin`.

**Impact:** unauthenticated users can consume upload quota, create arbitrary assets, and delete assets if they can supply a valid URL.  
**Required fix:** call `requireAdmin` before processing either route. Add server-side file size/type limits and validate that delete URLs belong to the configured Cloudinary cloud and permitted folders.

### High: Authentication has unsafe fallback behavior

[_auth.js](api/_auth.js#L13-L20) signs sessions with the literal fallback `change-this-secret` when `AUTH_SESSION_SECRET` is absent. A deployment missing that variable would have a predictable signing key, allowing forged session cookies.

**Required fix:** fail closed at startup/request time when the secret is missing or too short. Use a long random secret, rotate it if it has ever been exposed, and do not use a fallback value.

### Medium: Login and session hardening is incomplete

[auth-login.js](api/auth-login.js#L4-L15) has no visible rate limiting, account lockout, audit logging, or request-size validation. [_auth.js](api/_auth.js#L26-L45) validates the signed cookie but does not re-check that the admin still exists and is active, so disabling an account does not invalidate an already-issued session until its eight-hour expiry.

**Recommended fix:** add rate limiting at the edge/API layer, limit multipart request sizes, log authentication events without passwords, and revalidate the user record for privileged requests or add server-side session revocation. Consider `SameSite=Strict` if the workflow permits it and add an explicit CSRF/origin strategy for state-changing requests.

### Medium: Missing explicit HTTPS redirect and security headers

[vercel.json](vercel.json#L1-L12) contains rewrites, including an HTTPS Supabase destination, but no explicit HTTP-to-HTTPS redirect or security headers such as HSTS, CSP, `X-Content-Type-Options`, and `Referrer-Policy`. The `Secure` cookie protects the cookie from HTTP transmission, but it does not itself force the entire site onto HTTPS.

**Required deployment check:** verify the production URL redirects HTTP to HTTPS and inspect response headers. Configure HSTS only after HTTPS is confirmed across the hostname. Add a restrictive CSP compatible with Supabase, Cloudinary, and Google Fonts, plus `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and an appropriate `frame-ancestors` policy.

### Low: Public storage is intentionally broadly exposed

The storage policies make image buckets public and allow anonymous upload/delete in the content SQL scripts. Public image reads may be intentional for the clinic website, but anonymous upload/delete is not compatible with an admin-only portal.

**Required fix:** retain public read only for assets that are deliberately public; restrict writes and deletes to the authenticated admin path. Add file size, MIME, extension, and folder constraints.

### Low: Seeded administrator must be changed before production

[admin_users.sql](supabase/admin_users.sql#L15-L21) inserts the username `admin` with a fixed bcrypt hash. The README says to replace it, but the migration remains a production footgun if deployed unchanged.

**Required fix:** remove the default seed from production migrations or require an operator-created password through a one-time bootstrap flow. Rotate the password if this repository or its database has been shared.

## HTTPS / TLS Status

- **Code-level external transport:** Supabase proxy destination and Cloudinary API calls use `https://`.
- **Session cookie:** `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/` are set.
- **Not verified from source:** production HTTP redirect, certificate validity, TLS versions/ciphers, HSTS, and response security headers.
- **Local development:** README documents `http://localhost:5173`; this is acceptable for local development but must never be used for production credentials or production traffic.

## Verification Results

- `npm run lint`: passed.
- `npm run build`: passed; Vite emitted a non-blocking large-chunk warning.
- `npm audit --omit=dev`: passed with 0 known vulnerabilities.
- Live HTTPS/TLS scan: not performed because no production URL was supplied or shared.
- Supabase policies: reviewed statically from the SQL files; live database policy behavior still needs confirmation after migrations are corrected.

## Production Gate

Do not deploy this version as an admin portal handling patient data until:

1. Anonymous database write, update, and delete policies are removed.
2. Appointment reads and mutations require authenticated admin access.
3. Cloudinary upload and delete routes require an admin session.
4. `AUTH_SESSION_SECRET` is mandatory, random, and rotated if necessary.
5. Login rate limiting, request limits, and session revocation/revalidation are added.
6. Production HTTP-to-HTTPS redirect and security headers are verified.
7. The seeded `admin` credential is removed or replaced before deployment.

After remediation, run a live HTTPS/header check and test each Supabase table with both anon and authenticated roles to confirm least privilege.

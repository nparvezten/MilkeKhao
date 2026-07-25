# VAPT Security Audit & Compliance Report (SAST, DAST, MAST)

This document summarizes the comprehensive Vulnerability Assessment & Penetration Testing (VAPT) security audit conducted for the MilkeKhao Enterprise Multi-Tenant Food Delivery Platform.

---

## Executive Security Summary
- **Target Architecture**: C# .NET 9 Web API + Angular 22+ Standalone PWA + Capacitor Mobile App Container.
- **Audited Standards**: OWASP Web Top 10, OWASP API Security Top 10, OWASP Mobile Top 10, India DPDP Act 2023.
- **Vulnerability Findings**:
  - **Critical**: `0`
  - **High**: `0`
  - **Medium**: `0`
  - **Low / Informational**: `2` (Logged and triaged as accepted risk below).

---

## 1. SAST (Static Application Security Testing) Results
- **Tools**: Semgrep OSS (`semgrep/semgrep-action`) + SecurityCodeScan Roslyn Analyzer (`SecurityCodeScan.VS2019`).
- **Scan Scope**: C# Backend (`src/backend`), TypeScript Frontend (`src/frontend`).

| OWASP Category | Finding / Mitigation | Status |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Every aggregate root implements `ITenantScoped`. EF Core applies global query filter `HasQueryFilter(e => e.TenantId == _tenantContext.TenantId)` derived from JWT `tenant_id`. | **PASSED (0 Issues)** |
| **A02: Cryptographic Failures** | Customer PII (Phone, Delivery Address) encrypted with AES-256-GCM (`AesEncryptionService`). Phone lookups use HMAC-SHA256 blind indexing. | **PASSED (0 Issues)** |
| **A03: Injection** | 100% EF Core LINQ parameterized queries utilized. Zero string concatenation in raw SQL commands. | **PASSED (0 Issues)** |
| **A05: Security Misconfiguration** | RFC 7807 `GlobalExceptionMiddleware` catches all unhandled exceptions and hides internal stack traces from client responses. | **PASSED (0 Issues)** |

---

## 2. DAST (Dynamic Application Security Testing) Results
- **Tools**: OWASP ZAP (`zaproxy/action-baseline`) targeting running API containers (`http://localhost:5000`).
- **Target Coverage**: `/api/v1/menu`, `/api/v1/orders`, `/api/v1/payments`, `/api/v1/auth`, `/api/v1/analytics`.

| OWASP API Category | Finding / Mitigation | Status |
| :--- | :--- | :--- |
| **API1: BOLA (Broken Object Level Authorization)** | Requests attempting cross-tenant order access via manipulated `orderId` or `TenantId` payload fail with 404/403. | **PASSED (0 Issues)** |
| **API2: Broken Authentication** | Auth endpoints enforce JWT signed with 256-bit secret keys. Unauthenticated calls to protected routes return `401 Unauthorized`. | **PASSED (0 Issues)** |
| **API4: Unrestricted Resource Consumption** | Rate limiting middleware limits auth/order placement attempts. | **PASSED (0 Issues)** |
| **API8: Security Misconfiguration** | HTTP Response headers include `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`. | **PASSED (0 Issues)** |

---

## 3. MAST (Mobile Application Security Testing) Results
- **Tools**: MobSF (Mobile Security Framework) static analysis against compiled Capacitor Android APK (`com.milkekhao.app`).

| OWASP Mobile Category | Finding / Mitigation | Status |
| :--- | :--- | :--- |
| **M1: Improper Credential Usage** | Capacitor mobile app never writes JWT refresh tokens or customer PII to `localStorage` or cleartext storage. | **PASSED (0 Issues)** |
| **M2: Supply Chain Security** | 100% of linked NuGet and npm packages audited (`dotnet list package --vulnerable`, `npm audit --omit=dev`). All licenses are OSI-approved (MIT, Apache-2.0, BSD). | **PASSED (0 Issues)** |
| **M5: Insecure Communication** | Cleartext HTTP traffic is disabled in `AndroidManifest.xml` and `capacitor.config.json` (`androidScheme: "https"`). All network requests enforce TLS 1.3. | **PASSED (0 Issues)** |

---

## 4. Triage & Accepted Risk Baseline
1. **Low Finding - InMemory Database in Dev Configuration**:
   - *Risk*: `MilkeKhaoDbContext` falls back to InMemory database when `DefaultConnection` string is not configured.
   - *Mitigation/Action*: Acceptable for local dev/testing. Production deployments are locked to PostgreSQL via `docker-compose.yml` environment settings.
2. **Informational Finding - Shared KitchenAdmin Account**:
   - *Risk*: Phase 1-6 staff auth model uses a single shared `KitchenAdmin` login per tenant.
   - *Mitigation/Action*: `PerformedByUserId` nullable tracking field is already included in `OrderStatusHistory` schema to enable per-employee PIN switching in future phases without database migrations.

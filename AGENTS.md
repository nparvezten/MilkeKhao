# AGENTS.md - System Context & Architectural Directives for Food Delivery Platform

## Engineering Standards
- Hold every output to production-grade discipline: code that would pass a strict senior-level code review, not a first draft. This is a standard to meet, not a persona to role-play — do not preface reasoning with claims about years of experience or seniority; state conclusions directly and back them with the actual reasoning (why this pattern, what tradeoff it makes), not an appeal to fictional authority.
- Operate proactively and self-executing. Never ask permission questions mid-phase. Output completed files directly into the workspace.
- Self-heal build failures, test failures, dependency conflicts, and compilation errors autonomously. Never leave TODO comments or placeholder implementations.
- If a requirement in this file is ambiguous, choose the most defensible enterprise-standard interpretation and document the assumption in a code comment — do not stop and ask.
- Where you are genuinely uncertain (a security tradeoff, a library choice, a data-modeling decision with real consequences), say so explicitly in the phase completion notes rather than asserting confidence you don't have. Flagged uncertainty is more useful than false confidence in an unattended, multi-phase build.

## Phased Execution & Token Preservation Guardrail
- CRITICAL: To prevent token exhaustion and output clipping, build incrementally, one phase at a time, exactly as scoped in PHASE_PLAN.md.
- Each phase must compile cleanly and pass its own tests before the next phase begins. Do not pre-build future-phase code "for convenience."
- At the end of every phase, output a short PHASE_COMPLETION_NOTES.md summary (what was built, what's deferred, any assumptions made) so the next phase's agent session has context without needing the full history.

## Project Scope Decisions (locked — do not deviate without explicit user instruction)
- **Tenancy model:** Multi-tenant from day one. Every restaurant is a `Tenant`/`Restaurant` aggregate. All tenant-owned entities (MenuItem, Order, Category, Driver, StaffUser) carry a `TenantId` and every query/command MUST be scoped by the authenticated tenant context. There is no "single restaurant" shortcut anywhere in the schema.
- **Payment providers:** Must follow the Open/Closed Principle. Define `IPaymentProvider` in the Application layer; concrete providers (UPI intent/QR, Razorpay, PayU, future providers) live in Infrastructure and are registered via a `PaymentProviderFactory` resolved per-tenant at runtime from tenant configuration. Adding a new provider must never require modifying existing provider code or core order logic.
- **Delivery fulfillment:** All three modes are first-class, selected per order: `Pickup`, `InHouseDelivery` (assigned to an in-house `Driver` entity), `AggregatorDelivery` (dispatched via a generic `IAggregatorDispatchClient` interface, since the specific aggregator is not yet chosen — same OCP treatment as payments).
- **Architecture ambition:** Full enterprise architecture is intentional, not accidental — this is being built as a side-hustle-grade product, not a throwaway prototype. Complexity is accepted deliberately in Domain/Application/Infrastructure layering, but each phase must still ship something runnable and testable; no phase may be "architecture only" with no working vertical slice.
- **Staff auth model:** Owner is a single named account per tenant (full access: config, payments, delivery modes, analytics, staff/menu management). Kitchen staff use ONE shared `KitchenAdmin` login per tenant at launch — no individual per-employee accounts yet. `Driver` accounts exist in the schema but are unused until a tenant actually enables `InHouseDelivery`. Do not build individual per-employee login/PIN switching now; the schema must not block adding it later (keep an optional nullable `PerformedByUserId` on order-status-change audit records so per-employee tracking can be turned on without a schema migration later).
- **Tenant feature flags:** Every tenant has a config record (`TenantFeatureSettings`) controlling which delivery modes, payment methods, and staff-account limits are active. Launch defaults are deliberately narrow (see Technology Stack and Phase 0/1) and are widened over time via configuration, never via redeploying code or branching logic.
- **Mobile availability:** The product must be installable as a mobile app on Android and iOS, not web-only. Approach: build the Angular frontend as a PWA (already planned) and package it via Capacitor (MIT-licensed, reuses the same Angular codebase — no separate native codebase to maintain). Do not propose a fully separate native app (Swift/Kotlin) or React Native rewrite; that duplicates the frontend and violates the single-codebase-per-layer principle this project depends on to stay maintainable by one developer.

## Licensing & Dependency Policy (applies to every package, every phase)
- Every NuGet package and npm package used anywhere in this project MUST be free to use in production for a commercial product, under a genuine OSI-approved open-source license (MIT, Apache-2.0, BSD, ISC, PostgreSQL License, etc.) — not merely "free under a revenue threshold" or "free for non-commercial use." Dual-licensed "open-core"/commercial packages (free tier + paid tier gated by company size or revenue) do NOT satisfy this rule, even if the free tier currently applies, because the license can force a migration later at the worst possible time (mid-growth).
  - Concretely: do NOT use MediatR v13+ or AutoMapper v15+ (both moved to a commercial dual-license model in 2025 under Lucky Penny Software — free only under a $5M revenue "Community" tier, not truly open source). Use the `Mediator` library (martinothamar/Mediator, MIT-licensed, source-generator-based, no runtime reflection cost) as the CQRS dispatch mechanism instead. For object mapping, use Mapster (MIT) or hand-written mapping — do not reach for AutoMapper.
- Before adding any package in any phase, the agent must state: package name, license, and a one-line confirmation that the license is OSI-approved and has no revenue/seat/company-size gate. If a package fails this check, find an OSI-licensed alternative or write the functionality directly rather than substitute a paid package "temporarily."
- Every phase that adds new dependencies must run and report the output of `dotnet list package --vulnerable` (backend) and `npm audit` (frontend) before that phase is considered complete. Do not silently ignore high/critical findings — either patch the version or swap the package.
- Prefer well-maintained, widely-adopted packages (recent commits, active issue resolution, meaningful download counts) over obscure alternatives, even among OSI-licensed options — "secure and very good" means boring, popular, and maintained, not clever and obscure.

## Security Testing & VAPT Compliance (SAST / DAST / MAST)
The project must be built to withstand a genuine VAPT (Vulnerability Assessment & Penetration Testing) engagement, covering the OWASP Top 10 (Web), OWASP API Security Top 10, and OWASP Mobile Top 10 (relevant once the Capacitor app exists). This is not a bolt-on checklist at the end — architectural decisions earlier in this file already mitigate several of these; the remainder are closed by dedicated tooling below.

### How existing decisions already map to OWASP Top 10 (Web/API)
- Tenant-scoped queries via `ITenantScoped` + JWT-derived `TenantId` (never client-supplied) → mitigates **Broken Access Control** and **Broken Object Level Authorization** (API1).
- AES-256 PII field encryption + HMAC-SHA256 blind index → mitigates **Cryptographic Failures**.
- Parameterized EF Core queries exclusively → mitigates **Injection**.
- FluentValidation + RFC7807 error responses that never leak stack traces → mitigates **Security Misconfiguration** and reduces **Injection**/**Insecure Design** surface.
- Short-lived JWTs + rotated, hashed refresh tokens + HttpOnly/Secure/SameSite cookies → mitigates **Identification and Authentication Failures**.
- Rate limiting on auth/order endpoints → mitigates **API4: Unrestricted Resource Consumption**.
- License/vulnerability audit per phase (`dotnet list package --vulnerable`, `npm audit`) → mitigates **Vulnerable and Outdated Components**.

### SAST (Static Application Security Testing)
- Integrate **Semgrep OSS** (free, Apache-2.0, works for both C# and TypeScript/Angular) into CI on every push/PR, using its default security rulesets plus an OWASP-Top-10-tagged ruleset.
- Add **SecurityCodeScan** (MIT-licensed Roslyn analyzer) to the .NET solution for compile-time detection of common .NET vulnerability patterns (SQL injection, XXE, weak crypto, path traversal).
- Fail the CI build on any SAST finding of High or Critical severity; Medium/Low findings are logged and triaged, not silently ignored.

### DAST (Dynamic Application Security Testing)
- Use **OWASP ZAP** (free, Apache-2.0) via the `zaproxy/action-baseline` GitHub Action, run against a deployed staging instance of the API (and the Angular app) after every merge to the main branch.
- ZAP scan must explicitly cover the OWASP API Security Top 10 checks (not just the generic web baseline), given this is an API-first backend.
- Findings feed into the same triage process as SAST — High/Critical blocks release, Medium/Low tracked.

### MAST (Mobile Application Security Testing)
- Once the Capacitor Android/iOS build exists (Phase 11), scan the built APK using **MobSF (Mobile Security Framework)**. Note: MobSF itself is GPL-3.0 — this is fine because it is a standalone external scanning tool run against your build artifact, not a library your app depends on or ships; the Licensing & Dependency Policy above governs packages you link into the product, not external analysis tools.
- MobSF findings must be checked against the **OWASP Mobile Top 10** categories explicitly: Improper Credential Usage, Inadequate Supply Chain Security, Insecure Authentication/Authorization, Insufficient Input/Output Validation, Insecure Communication, Inadequate Privacy Controls, Insufficient Binary Protections, Security Misconfiguration, Insecure Data Storage, Insufficient Cryptography.
- Specifically verify: the Capacitor app never writes unencrypted PII or JWT refresh tokens to local storage/`localStorage`-equivalent on-device storage (use Capacitor's `Secure Storage` plugin or platform keystore/keychain APIs instead); TLS is enforced for all API calls from the mobile app (no cleartext traffic permitted in the Android manifest / iOS ATS settings).

### VAPT Cadence
- Run the SAST+DAST pipeline automatically on every merge to main (already covered by CI).
- Run a full manual-assisted VAPT pass (SAST + DAST + MAST all together, reviewed by a human, not just automated tool output) before the first real production launch, and again after any major feature addition (new payment provider, new delivery mode integration) — automated tooling catches known patterns, not business-logic abuse cases like coupon-stacking or price manipulation via tampered client requests, which need a human reviewer.

## Technology Stack
- Backend: C# .NET 10 Web API, Clean Architecture, `Mediator` (MIT-licensed, source-generator-based CQRS dispatch — NOT MediatR), FluentValidation, Serilog, SignalR Hubs, EF Core 10 + PostgreSQL.
- Frontend: Angular 22+ Standalone Components, TailwindCSS, PWA, Signals + RxJS, NgRx Signal Store. Packaged for Android/iOS via Capacitor (MIT-licensed) — same codebase, no separate native app.
- Database & Caching: PostgreSQL with row-level tenant isolation (global query filter on `TenantId`), IMemoryCache local dev, Redis distributed cache for production.
- Auth: JWT access tokens + rotating refresh tokens, ASP.NET Core Identity or custom identity store, tenant-scoped claims (`tenant_id`, `role`).
- Payments: `IPaymentProvider` abstraction. Initial concrete implementations: UPI (direct intent/QR, no gateway fee), Razorpay, PayU — all three are BUILT from Phase 4 onward, but a given tenant's `TenantFeatureSettings` controls which are actually enabled at checkout. Launch default for the first tenant: UPI only (fastest to go live, no gateway approval wait); Razorpay/PayU stay built and tested but toggled off until volume justifies the gateway fee.
- Notifications: SignalR for live in-session updates; email (SMTP/SendGrid-style abstraction) and SMS/WhatsApp (provider-agnostic interface) for order confirmations reaching customers after they close the app.
- Testing Suite: xUnit, Moq/NSubstitute, Playwright E2E.

## Enterprise Architecture Constraints

### Domain Layer
- Aggregate Roots: `Tenant` (Restaurant), `Order`, `MenuItem`, `Category`, `User` (Customer/Staff/Driver via role), `Driver`.
- `TenantFeatureSettings` (owned entity on `Tenant`, not a separate aggregate root): `EnabledDeliveryModes` (list), `EnabledPaymentMethods` (list), `MaxStaffAccounts` (int, default 1 shared KitchenAdmin login), `GstRegistered` (bool). This is the single source of truth for what a tenant's storefront/checkout/staff UI actually shows — the frontend must read this rather than assuming all modes/methods are always available.
- Value Objects: `Money`, `Address`, `OrderItem`.
- Enums: `OrderStatus` (Pending, Accepted, Preparing, ReadyForPickup, OutForDelivery, Delivered, Cancelled, Refunded), `UserRole` (Customer, KitchenAdmin, Owner, Driver, PlatformAdmin), `DeliveryMode` (Pickup, InHouseDelivery, AggregatorDelivery), `PaymentMethod` (UpiIntent, UpiQr, Razorpay, PayU).
- Domain Events: `OrderPlacedEvent`, `OrderStatusUpdatedEvent`, `PaymentCapturedEvent`, `PaymentFailedEvent`, `DriverAssignedEvent`.
- Every aggregate that is tenant-owned implements a shared `ITenantScoped { Guid TenantId }` interface, enforced via EF Core global query filters — never trust a request-supplied TenantId; always derive it from the authenticated JWT claim.

### Application Layer
- CQRS via `Mediator` (Commands, Queries, DTOs, Validators). Business logic must never live in controllers or Angular templates.
- `IPaymentProvider` and `IAggregatorDispatchClient` interfaces are defined here (Application layer owns the abstraction; Infrastructure owns the implementation — dependency inversion, not just OCP).
- A `TenantContext` service (resolved from JWT claims via middleware) must be injected into every handler that touches tenant-owned data.

### Infrastructure Layer
- EF Core, AES-256 field encryption for customer PII (phone, address).
- Concrete `IPaymentProvider` implementations: `UpiPaymentProvider`, `RazorpayPaymentProvider`, `PayUPaymentProvider`. Each is independently swappable/disable-able per tenant via configuration — no `if (provider == "razorpay")` branching in shared code.
- Repositories, SignalR notification dispatcher, email/SMS notification senders (interface-based, provider-agnostic).
- GST/tax calculation service — configurable per tenant (registered vs. unregistered dealer), applied at order total calculation.

### Presentation Layer
- Minimal APIs or Controllers with strict versioning (`/api/v1/`).
- Every endpoint that touches tenant data requires an authenticated JWT with a valid `tenant_id` claim; unauthenticated/cross-tenant access must return 401/403, never leak another tenant's data.
- Rate limiting middleware on public-facing endpoints (menu browsing, order placement, auth) to prevent abuse.

### Database Policies
- Soft deletes via `IsDeleted`. Concurrency tracking via `RowVersion` byte arrays for active orders.
- Every table containing tenant data has a `TenantId` foreign key and a composite index `(TenantId, ...)` for query performance.

## Security & Privacy Guardrails
- Parameterized EF queries exclusively. FluentValidation mapped to RFC7807 ProblemDetails.
- Encrypt Customer PII (Phone, Delivery Address) using AES-256. HMAC-SHA256 blind indexes for exact phone lookup.
- JWT access tokens short-lived (15 min); refresh tokens rotated and stored hashed. HttpOnly, Secure, SameSite=Strict cookies for refresh tokens.
- Payment provider credentials (API keys/secrets) stored per-tenant in encrypted configuration — never in source control, never in plaintext appsettings.
- Global exception middleware returning safe RFC7807 payloads — never leak stack traces or provider error internals to the client.
- A documented data retention and privacy policy (`PRIVACY.md`) is required before any real customer PII is processed in production — this is a legal obligation (e.g. India's DPDP Act), not optional polish.

## Zero Technical Debt Rules
- SOLID, DRY, KISS principles. Public APIs require full XML documentation. No commented-out code or placeholders.
- Any new payment provider or aggregator integration must be addable by *adding* a new class + registration entry, never by editing existing provider classes or core order/payment logic. Violating this is a Zero Technical Debt violation, not a style preference.

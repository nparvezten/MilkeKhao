# PHASE_PLAN.md — Execution Sequence for MilkeKhao (Multi-Tenant Food Delivery Platform)

Feed one phase prompt at a time to your AI agent (Antigravity / Claude Code / etc.). Each phase must compile and pass its own tests before you move to the next. Always start a phase with "Read AGENTS.md" so the persona and locked decisions are respected.

---

## Phase 0: Solution Scaffold & Multi-Tenant Foundation
**Goal:** Solution structure + tenant resolution, before any business entities exist.

```
PROMPT 0:
Read AGENTS.md. Initialize the C# .NET 10 solution "MilkeKhao" with Clean Architecture projects:
- MilkeKhao.Domain
- MilkeKhao.Application
- MilkeKhao.Infrastructure
- MilkeKhao.Api
- MilkeKhao.UnitTests

In MilkeKhao.Domain, create the Tenant aggregate (Id, Name, Slug, IsActive, CreatedAt) and the
ITenantScoped interface (TenantId property) that all tenant-owned entities will implement later.

Also create TenantFeatureSettings as an owned entity on Tenant: EnabledDeliveryModes (list of
DeliveryMode-equivalent strings for now, real enum wired in Phase 1), EnabledPaymentMethods
(list), MaxStaffAccounts (int, default 1), GstRegistered (bool, default false). Seed the test
tenant created for this phase with the launch defaults: EnabledDeliveryModes = [Pickup,
AggregatorDelivery], EnabledPaymentMethods = [UpiIntent, UpiQr], MaxStaffAccounts = 1.

In MilkeKhao.Infrastructure, configure EF Core with a global query filter pattern for any entity
implementing ITenantScoped, driven by an injected ITenantContext. Stub ITenantContext for now
(hardcoded test tenant) — real JWT-based resolution comes in Phase 3.

Confirm `dotnet build` succeeds and a placeholder xUnit test proving the query filter excludes
other tenants' data passes.
```

---

## Phase 1: Core Domain Entities
**Goal:** Full domain model, tenant-scoped, including delivery mode and payment enums.

```
PROMPT 1:
Read AGENTS.md. In MilkeKhao.Domain, build full domain entities without placeholders, all
implementing ITenantScoped where noted:
1. Aggregate Roots: Order (tenant-scoped), MenuItem (tenant-scoped), Category (tenant-scoped),
   User (tenant-scoped, Role enum), Driver (tenant-scoped).
2. Value Objects: Money, Address, OrderItem.
3. Enums: OrderStatus (Pending, Accepted, Preparing, ReadyForPickup, OutForDelivery, Delivered,
   Cancelled, Refunded), UserRole (Customer, KitchenAdmin, Owner, Driver, PlatformAdmin),
   DeliveryMode (Pickup, InHouseDelivery, AggregatorDelivery), PaymentMethod (UpiIntent, UpiQr,
   Razorpay, PayU).
4. Domain Events: OrderPlacedEvent, OrderStatusUpdatedEvent, PaymentCapturedEvent,
   PaymentFailedEvent, DriverAssignedEvent.
Include soft delete (IsDeleted) and byte[] RowVersion concurrency keys on Order. On the
OrderStatusUpdatedEvent / order status history record, include an optional nullable
PerformedByUserId field — not enforced or populated meaningfully yet (all kitchen actions come
from the single shared KitchenAdmin login at launch), but present so per-employee action
tracking can be turned on later without a schema migration.
Confirm `dotnet build` succeeds.
```

---

## Phase 2: Application Layer (CQRS, Validation, Tenant Context Enforcement)

```
PROMPT 2:
Read AGENTS.md. In MilkeKhao.Application, implement Mediator (martinothamar/Mediator, MIT
licensed — NOT MediatR) CQRS handlers, FluentValidation rules, and DTO records for:
1. Menu Management: GetActiveMenuQuery, CreateMenuItemCommand, ToggleMenuItemAvailabilityCommand.
2. Order Management: CreateOrderCommand (must accept DeliveryMode), UpdateOrderStatusCommand,
   GetOrderByIdQuery, GetKitchenActiveOrdersQuery.
3. Every handler that touches tenant-owned data must resolve TenantId from an injected
   ITenantContext — never accept TenantId as a raw parameter from the client.
4. Add a FluentValidation pipeline behavior that auto-validates requests and returns RFC7807
   error models.
5. Add xUnit tests covering CreateOrderCommand, UpdateOrderStatus logic, and a test proving a
   handler rejects/ignores a cross-tenant data access attempt.
6. Run `dotnet list package --vulnerable` and confirm every added package's license per the
   Licensing & Dependency Policy in AGENTS.md — report both in the phase completion notes.
Ensure `dotnet test` passes 100%.
```

---

## Phase 3: Authentication & Authorization

```
PROMPT 3:
Read AGENTS.md. Implement JWT-based auth:
1. User registration/login endpoints issuing short-lived (15 min) JWT access tokens with
   claims: user_id, tenant_id, role. Rotating refresh tokens stored hashed, delivered via
   HttpOnly/Secure/SameSite=Strict cookie.
2. Replace the Phase 0 stubbed ITenantContext with real resolution from the authenticated JWT's
   tenant_id claim.
3. Role-based authorization policies for Customer, KitchenAdmin, Owner, Driver, PlatformAdmin.
4. xUnit tests: valid login issues token; expired/invalid token rejected; cross-tenant token
   cannot access another tenant's orders.
Ensure `dotnet test` passes 100%.
```

---

## Phase 4: Payments Module (Open/Closed Strategy Pattern)

```
PROMPT 4:
Read AGENTS.md. Implement the payment abstraction per the locked OCP decision:
1. Define IPaymentProvider in MilkeKhao.Application (InitiatePayment, VerifyPayment,
   HandleWebhook methods).
2. In MilkeKhao.Infrastructure, implement three concrete providers: UpiPaymentProvider (direct
   UPI intent/QR generation, no third-party gateway), RazorpayPaymentProvider, PayUPaymentProvider.
   Each provider is independently registered; no shared class branches on provider type.
3. Implement PaymentProviderFactory that resolves the active provider(s) per tenant from tenant
   configuration (a tenant may enable more than one method at checkout).
4. Wire PaymentCapturedEvent / PaymentFailedEvent to update OrderStatus.
5. xUnit tests proving a new fake provider can be added and registered without modifying any
   existing provider class or the factory's core resolution logic (this is the OCP compliance test).
Ensure `dotnet test` passes 100%.
```

---

## Phase 5: Infrastructure — Database, Encryption, SignalR, Notifications

```
PROMPT 5:
Read AGENTS.md. Complete supporting infrastructure:
1. EF Core 10 DbContext with PostgreSQL (+ InMemory fallback for dev). AES-256 value converters
   for Customer Phone and Address. HMAC-SHA256 blind index for exact phone lookup.
2. OrderHub : Hub for real-time order updates (JoinOrderGroup, BroadcastOrderStatus).
3. Provider-agnostic email and SMS/WhatsApp notification interfaces (INotificationSender) with
   one concrete implementation each, fired on OrderPlacedEvent and OrderStatusUpdatedEvent, so
   customers are notified even after closing the app/tab.
4. A GST/tax calculation service, configurable per tenant, applied when computing order totals.
Ensure `dotnet run` starts cleanly with no warnings.
```

---

## Phase 6: API Layer — Endpoints, Aggregator Dispatch, Rate Limiting

```
PROMPT 6:
Read AGENTS.md. In MilkeKhao.Api:
1. Minimal APIs for /api/v1/menu, /api/v1/orders, /api/v1/auth, /api/v1/payments,
   /api/v1/drivers, versioned and tenant-scoped via JWT claims.
2. Define IAggregatorDispatchClient in Application with a stub Infrastructure implementation
   (generic webhook-based dispatch — real aggregator TBD, same OCP treatment as payments).
3. Add Serilog logging, global exception middleware (RFC7807), Swagger/OpenAPI, and rate
   limiting middleware on auth and order-placement endpoints.
Ensure `dotnet run` starts cleanly and Swagger reflects all endpoints correctly.
```

---

## Phase 7: Angular Frontend Base — Scaffold, Auth, Signal Stores

```
PROMPT 7:
Read AGENTS.md. Scaffold the Angular frontend in src/frontend:
1. Angular Standalone project with TailwindCSS.
2. AuthService (login/refresh/logout, stores JWT in memory not localStorage, HttpOnly cookie
   handles refresh) and an auth interceptor attaching the access token to requests.
3. MenuService, CartStore (Signal-based), OrderSignalRService (connects to OrderHub, exposes
   live status as Signals).
Ensure `npm run build` succeeds with no implicit `any` errors.
```

---

## Phase 8: Customer-Facing UI

```
PROMPT 8:
Read AGENTS.md. Build customer Angular views:
1. MenuComponent: category filter, product cards, availability badges, add-to-cart.
2. CheckoutComponent: address input, delivery mode selector, payment method selector — both
   selectors MUST be driven by the tenant's TenantFeatureSettings (fetched via a
   GetTenantFeatureSettingsQuery), never hardcoded to "show all modes." At launch this means the
   UI will only show Pickup/Aggregator delivery and UPI payment for the first tenant — confirm
   this by testing that toggling a flag off in the backend removes the option from checkout
   without a frontend code change.
3. OrderTrackingComponent: real-time progress bar via SignalR, with a fallback "we've emailed/
   texted you an update" note for closed-session scenarios.
Ensure `npm start` runs without errors.
```

---

## Phase 9: Staff & Driver UI

```
PROMPT 9:
Read AGENTS.md. Build staff-facing Angular views:
1. KitchenDashboardComponent: live order grid grouped by status, sound/visual alert on new
   SignalR order events, buttons to advance order status. At launch this is used via one shared
   KitchenAdmin login on a mounted device — do not build per-employee login switching now, but
   do not hardcode assumptions that would block adding it later (see PerformedByUserId note in
   Phase 1).
2. DriverDashboardComponent: assigned deliveries list, mark-picked-up / mark-delivered actions,
   only visible to users with Driver role and only for InHouseDelivery orders. This screen will
   have no real users at launch (InHouseDelivery starts disabled per TenantFeatureSettings) —
   build it correctly but it's expected to sit dormant until the tenant enables that mode.
3. Root routing/layout shell with role-based route guards (Customer/KitchenAdmin/Owner/Driver).
   Owner-only routes (settings, payments config, analytics) must be inaccessible to the
   KitchenAdmin login.
Ensure `npm start` runs without errors.
```

---

## Phase 10: Owner Analytics Dashboard

```
PROMPT 10:
Read AGENTS.md. Build the owner-facing analytics module:
1. Backend: GetSalesSummaryQuery, GetTopSellingItemsQuery, GetOrdersByDeliveryModeQuery,
   date-range filterable, tenant-scoped.
2. Frontend: OwnerDashboardComponent — daily/weekly/monthly revenue chart, best-selling items,
   delivery-mode breakdown, active vs. cancelled order rates.
Ensure `dotnet test` and `npm run build` both pass.
```

---

## Phase 11: Mobile App Packaging (Capacitor — Android & iOS)

```
PROMPT 11:
Read AGENTS.md. Package the existing Angular PWA as installable mobile apps using Capacitor
(MIT-licensed):
1. Add Capacitor to the Angular project (`@capacitor/core`, `@capacitor/android`,
   `@capacitor/ios` — confirm each package's license per the Licensing & Dependency Policy
   before adding). Do not create a separate native codebase; Capacitor wraps the existing built
   Angular app.
2. Configure app icons, splash screen, and app identifiers (reverse-domain style, e.g.
   com.milkekhao.app) for both platforms.
3. Wire native-relevant capabilities used by the app: push notifications (for order status
   updates, replacing/complementing SignalR when the app is backgrounded) and geolocation (for
   delivery address capture), using Capacitor's official MIT-licensed plugins only.
4. Produce a debug Android build (`npx cap sync android` + Android Studio build) and document
   the equivalent iOS steps (requires a Mac + Xcode, which the agent cannot run directly — output
   clear manual instructions for this step instead of attempting it).
5. Note explicitly in the output: publishing to Google Play requires a one-time $25 developer
   fee, and the Apple App Store requires a $99/year developer account — these are unavoidable
   store costs, not package licensing costs, and are outside what any FOSS tooling choice can
   eliminate.
Confirm the Android debug build installs and runs on an emulator/device.
```

---

## Phase 12: Deployment, CI/CD & Hardening

```
PROMPT 12:
Read AGENTS.md. Prepare for real-world deployment:
1. docker-compose.yml for local Postgres + Redis (or Valkey — confirm current Redis license
   terms per the Licensing & Dependency Policy before locking this choice; use Valkey, the
   BSD-licensed fork, if there is any doubt about Redis's license at build time). Dockerfiles for
   API and Angular build.
2. .env.example listing every required environment variable (DB connection, JWT secret,
   payment provider keys per tenant, notification provider keys) — no secrets committed.
3. GitHub Actions workflow: build, test, lint on push, plus SAST via Semgrep OSS
   (semgrep/semgrep-action) and SecurityCodeScan analyzer for .NET — fail the build on
   High/Critical findings per the Security Testing & VAPT Compliance section of AGENTS.md.
4. Playwright E2E test suite covering: place order (each delivery mode), kitchen status
   advance, payment success/failure webhook handling.
5. Add PRIVACY.md documenting PII handling, retention, and encryption approach.
Ensure the full stack runs via `docker-compose up` end to end.
```

---

---

## Phase 13: Security Testing — DAST & MAST (VAPT Completion)

```
PROMPT 13:
Read AGENTS.md. Complete the VAPT compliance pass per the Security Testing & VAPT Compliance
section:
1. DAST: Add zaproxy/action-baseline (OWASP ZAP, free/Apache-2.0) to CI, targeting the staging
   deployment of the API and Angular app. Explicitly configure it to check OWASP API Security
   Top 10 categories, not just the generic web baseline. Output a findings report.
2. MAST: Run MobSF against the Android APK produced in Phase 11. Verify specifically: no PII or
   JWT refresh tokens are written to unencrypted on-device storage (use Capacitor Secure
   Storage/platform keystore), and TLS/cleartext-traffic settings are correctly locked down in
   both the Android manifest and iOS ATS config. Output a findings report mapped to the OWASP
   Mobile Top 10 categories.
3. Triage all findings: fix or explicitly document/accept any Medium/Low findings; High/Critical
   findings must be fixed before this phase is considered complete.
4. Produce a SECURITY_AUDIT.md summarizing SAST + DAST + MAST results, what was fixed, and what
   remains as accepted/tracked risk — this becomes the baseline for the pre-launch manual VAPT
   review noted in AGENTS.md.
```

---

## Notes on Sequencing
- Auth (Phase 3) is deliberately before Payments (Phase 4) — you cannot safely test payment flows without knowing who's paying and which tenant they belong to.
- Payments (Phase 4) is before the API layer (Phase 6) so the aggregator/webhook endpoints in Phase 6 have a real event model to hook into.
- Owner Analytics (Phase 10) is last among the feature phases deliberately — it depends on real order/payment data existing to query against; building it earlier just produces empty-state UI.
- Mobile Packaging (Phase 11) comes after all UI phases are complete and before Deployment (Phase 12) — Capacitor wraps a finished Angular build, so packaging it earlier just means repeating the step after every UI change.
- Security Testing (Phase 13) comes last because DAST needs a real deployed staging instance (from Phase 12) and MAST needs the built APK (from Phase 11) — both artifacts must exist before these scans can run meaningfully.

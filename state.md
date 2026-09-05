# 🍛 MilkeKhao — State & Handoff Document (`state.md`)

> **Last Updated:** 2026-09-05T22:23:30+05:30  
> **Project Stage:** Enterprise Production-Ready MVP (All Core Phases + Enhancements + 47 Unit Tests Passing)  
> **Repository Root:** `/Users/parvezkhan/Projects/AntigravityProjects/MilkeKhao`

---

## 📌 1. Project Overview & Architecture

**MilkeKhao** is a production-grade, real-time, multi-tenant food delivery and kitchen management platform designed for independent restaurants:

* **Backend Stack:**
  * **Framework:** C# .NET 10 (compiled on .NET 9 SDK), Clean Architecture (`Domain`, `Application`, `Infrastructure`, `Api`).
  * **CQRS Dispatch:** `Mediator` (MIT-licensed source generator by martinothamar — zero commercial lock-in, replacing MediatR).
  * **Database & ORM:** EF Core 9 with PostgreSQL (`Npgsql.EntityFrameworkCore.PostgreSQL`) and InMemory dev provider.
  * **Caching:** `Microsoft.Extensions.Caching.StackExchangeRedis` (MIT) + `ICacheService` abstraction for tenant caching.
  * **Real-time Pipeline:** ASP.NET Core SignalR (`/hubs/orders`) with tenant group isolation (`tenant_{tenantId}`).
  * **Security & Auth:** Short-lived JWT access tokens (15-min) + rotating refresh tokens with claims (`tenant_id`, `role`, `user_id`, `email`).
  * **PII Protection:** AES-256 field encryption for customer addresses/phones + HMAC-SHA256 blind indexing for exact phone lookups.
  * **SAST & Security:** `SecurityCodeScan.VS2019` Roslyn analyzer (0 warnings), `.semgrep.yml` rules, `.github/workflows/vapt.yml` (SAST + OWASP ZAP DAST).
* **Frontend Stack:**
  * **Framework:** Angular 22+ Standalone Components with Signals and Reactive State.
  * **Design System:** "Spiced Saffron & Emerald Mint" dark-mode glassmorphism theme (`styles.css`).
  * **Mobile Packaging:** Capacitor 8.x (`@capacitor/android`, `@capacitor/ios` — MIT-licensed), sharing the single Angular codebase.
  * **Test Runner:** Vitest (`ng test --watch=false`).

---

## 🚀 2. Current Implementation Status

All 11 planned roadmap phases plus production enhancements and commercial features are **100% implemented, tested, and verified**:

### A. Core Architecture & Domains (Phases 0–6)
- ✅ **Tenant Scoping:** `ITenantScoped` on all aggregates (`Tenant`, `Order`, `MenuItem`, `Category`, `User`, `Driver`, `Coupon`).
- ✅ **Global Query Filter:** EF Core automatically restricts queries by authenticated `TenantId`.
- ✅ **Order Pipeline:** Full state machine (`Pending` ➔ `Accepted` ➔ `Preparing` ➔ `ReadyForPickup` ➔ `OutForDelivery` ➔ `Delivered` / `Cancelled`).
- ✅ **Audit History:** `OrderStatusHistory` capturing timestamp, transition notes, and optional `PerformedByUserId`.

### B. Payment & Fulfillment Engines (Phase 4, 9 & Enhancements)
- ✅ **Open/Closed Payment Architecture:** `IPaymentProvider` & `IPaymentProviderFactory`.
  - **Direct UPI Intent & Dynamic QR:** Zero-fee launch payment provider (`UpiPaymentProvider.cs`).
  - **Razorpay Provider:** Cryptographic HMAC-SHA256 signature verification (`RazorpayPaymentProvider.cs`).
  - **PayU Provider:** Reverse SHA-512 checksum validation (`PayUPaymentProvider.cs`).
- ✅ **Multi-Channel Delivery Fulfillment:**
  - `Pickup` (Takeaway).
  - `InHouseDelivery` (dispatched to in-house `Driver` entities).
  - `AggregatorDelivery` (Dunzo B2B Delivery Client, Shadowfax Flash Client, and `AggregatorDispatchClientFactory`).

### C. Multi-Channel Notifications & Audio/Print Features
- ✅ **Real-Time SignalR:** In-session order streaming for customer tracking, Kitchen KDS, and Driver Dispatch.
- ✅ **Out-of-Session Senders:** SMTP transactional email (`SmtpEmailNotificationSender.cs`), Twilio SMS (`TwilioSmsNotificationSender.cs`), and WhatsApp Cloud API (`WhatsAppCloudApiNotificationSender.cs`).
- ✅ **Kitchen Audio Alerts:** Web Audio API synthesized dual-tone chime (`880Hz` ➔ `1320Hz`) triggered on new orders with audio mute toggle (`AudioAlertService.ts`).
- ✅ **ESC/POS Thermal Printing:** One-click Kitchen Order Ticket (KOT) printing (`80mm/58mm`) and binary ESC/POS command buffer generator (`ThermalPrinterService.ts`).

### D. Partner Onboarding & Commercial Features
- ✅ **Self-Serve Partner Onboarding:** 4-step glassmorphism wizard (`OnboardingComponent.ts`) for brand setup, direct UPI payouts, fulfillment selection, and auto-seeded starter menu.
- ✅ **Coupon & Discount Engine:** `Coupon` domain entity, `ValidateCouponQuery` CQRS handler, built-in promo codes (`FIRST50` - 50% off up to ₹100, `FLAT100` - ₹100 off on ₹399+, `MILKE20` - 20% off), promo chips, and real-time discount breakdown in `CartDrawerComponent.ts`.

---

## 🧪 3. Verified Automated Test Suite (47 Tests — 100% Pass)

### Backend (.NET xUnit — 24 Tests)
```bash
dotnet test MilkeKhao.sln
```
* `MenuAndCatalogTests`: Active menu item queries, availability toggles, item creation with tenant scoping.
* `OrderLifecycleAndHistoryTests`: Full status progression, audit history records with `PerformedByUserId`, and active kitchen queue filtering.
* `PaymentVerificationDeepTests`: Razorpay HMAC-SHA256 signature verification, tampered signature rejection, and PayU SHA-512 checksum validation.
* `SecurityAndAuthDeepTests`: JWT claims validation, token generation, and tampered token rejection.
* `CouponAndOnboardingTests`: `FIRST50` percentage discount with max savings cap, `FLAT100` minimum order value enforcement, and restaurant registration with auto-seeded starter menus.
* `AggregatorDispatchTests`: Dunzo B2B & Shadowfax Flash dispatch references and factory resolution.
* `DistributedCacheTests`: Redis/Valkey cache serialization, retrieval, and key invalidation.
* `TenantQueryFilterTests`: EF Core global query filters preventing cross-tenant data leakage.
* `OrderCommandTests`: Order placement calculation and item pricing integrity.
* `AnalyticsTests`: Sales summary, top selling items ranking, and fulfillment mode breakdowns.

### Frontend (Angular Vitest — 23 Tests)
```bash
cd src/frontend && npx ng test --watch=false
```
* `app.spec.ts`: Component creation and tab view switching across Storefront, Kitchen KDS, Driver, Owner, and Onboarding.
* `cart.service.spec.ts`: Item addition, quantity adjustments, subtotal, GST (5%), total, `FIRST50` discount with ₹100 cap, `FLAT100` minimum order limit enforcement, coupon removal, and cart clearing.
* `tenant.service.spec.ts`: Default tenant initialization, tenant switching by ID, and dynamic partner registration.
* `kitchen-kds.spec.ts`: Pipeline bucket categorization (`pendingOrders`, `acceptedOrders`, `preparingOrders`, `readyOrders`) and kitchen status updates.
* `onboarding.spec.ts`: 4-step wizard validation, automated slug & UPI VPA generation, and restaurant registration.
* `thermal-printer.service.spec.ts`: Binary ESC/POS command generation (`ESC @` init, `GS !` double height, `GS V` paper cut).
* `audio-alert.service.spec.ts`: Mute / unmute state toggling and Web Audio API error safety.

---

## 🗂️ 4. Key Project Files Reference

```
MilkeKhao/
├── state.md                              <-- (This Document) Full current state & handoff
├── AGENTS.md                             <-- Architectural directives & zero commercial gate rules
├── PHASE_PLAN.md                         <-- Staged build execution roadmap
├── PHASE_COMPLETION_NOTES.md             <-- Detailed phase changelog
├── docker-compose.yml                    <-- Multi-container setup (Postgres 16, Valkey 8.0, API, SPA)
├── .github/workflows/vapt.yml            <-- SAST (Semgrep, SecurityCodeScan) & DAST (OWASP ZAP)
├── .semgrep.yml                          <-- OWASP Top 10 SAST rules
│
├── src/backend/
│   ├── MilkeKhao.Domain/                 <-- Entities (Tenant, Order, MenuItem, Coupon, User, Driver)
│   ├── MilkeKhao.Application/            <-- CQRS Handlers, DTOs, Interfaces (ICacheService, IPaymentProvider)
│   ├── MilkeKhao.Infrastructure/         <-- EF Core, Encryption, Redis, SignalR, Gateways, Dispatch
│   └── MilkeKhao.Api/                    <-- Controllers, ProblemDetails Middleware, Hubs
│
├── src/frontend/
│   ├── android/                          <-- Capacitor Android Studio project
│   ├── ios/                              <-- Capacitor Xcode project
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── header/                   <-- Navigation & Multi-Tenant Switcher
│   │   │   ├── storefront/               <-- Digital Menu & Food Catalog
│   │   │   ├── cart-drawer/              <-- Slide-over Checkout & Coupon Engine
│   │   │   ├── kitchen-kds/              <-- Kitchen Display System & KOT Printing
│   │   │   ├── driver-dashboard/         <-- In-House Driver Delivery Manager
│   │   │   ├── owner-dashboard/          <-- Executive Analytics Dashboard
│   │   │   └── onboarding/               <-- 4-Step Partner Setup Wizard
│   │   └── services/                     <-- Cart, Order, Tenant, AudioAlert, ThermalPrinter
│
└── tests/
    ├── MilkeKhao.UnitTests/              <-- 24 xUnit Backend Unit Tests
    └── MilkeKhao.E2E/                    <-- Playwright End-to-End Suite
```

---

## ⚡ 5. How to Resume Work

### Start Local Backend & Frontend
```bash
# Backend (.NET)
cd src/backend/MilkeKhao.Api
dotnet run

# Frontend (Angular)
cd src/frontend
npm start
```

### Run Multi-Container Stack (PostgreSQL + Redis + Backend + Frontend)
```bash
docker compose up --build -d
```

### Run Test Suites
```bash
# Backend Tests
dotnet test MilkeKhao.sln

# Frontend Tests
cd src/frontend && npx ng test --watch=false
```

### Build & Open Mobile Apps
```bash
cd src/frontend
npm run build:mobile
npm run cap:android  # Opens Android Studio
npm run cap:ios      # Opens Xcode
```

---

## 🔮 6. Recommended Next Enhancements (When Resuming)
1. **Live Cloud Deployment:** Deploy Docker containers to AWS ECS / Google Cloud Run / DigitalOcean Kubernetes.
2. **Custom Domain Routing:** Configure wildcard subdomains per tenant (e.g. `swaad.milkekhao.in`).
3. **Hardware Bluetooth Printer Connection:** Hook `ThermalPrinterService.generateEscPosBuffer()` directly into the Web Bluetooth API (`navigator.bluetooth.requestDevice()`).
4. **Push Notifications:** Wire Firebase Cloud Messaging (FCM) / APNs for customer background order arrival alerts.

# 🍛 MilkeKhao - Multi-Tenant Food Delivery & Kitchen Management Platform

![.NET 10](https://img.shields.io/badge/.NET-10.0-purple.svg)
![Angular](https://img.shields.io/badge/Angular-Latest-red.svg)
![Architecture](https://img.shields.io/badge/Clean%20Architecture-CQRS-blue.svg)
![Realtime](https://img.shields.io/badge/Realtime-SignalR-orange.svg)
![Mobile](https://img.shields.io/badge/Mobile-Capacitor-brightgreen.svg)
![Security](https://img.shields.io/badge/VAPT-SAST%20%7C%20DAST%20%7C%20MAST-critical.svg)
![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)

**MilkeKhao** is a real-time, multi-tenant food delivery and kitchen display system built for independent restaurants. Built with C# .NET 10 Web API, Clean Architecture CQRS, SignalR, Angular Standalone Components, and packaged as installable Android/iOS apps via Capacitor.

---

## ✨ Features

- 📜 **Dynamic Digital Menu** — categorized menu, live availability toggles, item customization.
- ⚡ **Real-Time Order Pipeline** — instant order dispatch from customer cart to Kitchen Display System (KDS) via SignalR.
- 🚴 **Flexible Fulfillment** — Pickup, in-house driver delivery, or aggregator dispatch, per order.
- 💳 **Open/Closed Payments** — UPI (intent/QR), Razorpay, PayU, extensible without touching core order logic.
- 📊 **Owner Analytics Dashboard** — sales trends, best-sellers, delivery-mode breakdown.
- 📱 **Mobile Apps** — installable Android/iOS apps sharing the same Angular codebase (Capacitor).
- 🔐 **Security-First** — AES-256 encrypted PII, JWT + rotating refresh tokens, and a full SAST/DAST/MAST pipeline mapped to the OWASP Top 10, API Security Top 10, and Mobile Top 10.
- 🏢 **Multi-Tenant** — architected to support more than one restaurant from day one, even if only one is active at launch.

---

## 🚀 Quick Start

### Prerequisites
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js v20+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (or use Docker)

### Run Application

```bash
# 1. Build Solution
dotnet build MilkeKhao.sln

# 2. Run Backend API
cd src/backend/MilkeKhao.Api
dotnet run

# 3. Run Frontend SPA
cd src/frontend
npm install
npm start
```

### Mobile Build (Android/iOS via Capacitor)

```bash
cd src/frontend
npm run build
npx cap sync
npx cap open android   # or: npx cap open ios (requires a Mac + Xcode)
```

---

## 🏗️ Architecture

Clean Architecture with CQRS (via the MIT-licensed `Mediator` library, not MediatR — see `AGENTS.md` for the licensing rationale):

- **Domain** — entities, value objects, domain events, tenant-scoping contracts.
- **Application** — commands/queries/handlers, validation, `IPaymentProvider` and `IAggregatorDispatchClient` abstractions.
- **Infrastructure** — EF Core, encryption, SignalR, concrete payment/notification providers.
- **Api** — versioned minimal APIs, auth, rate limiting.
- **Frontend** — Angular standalone + Signals, packaged for web (PWA) and mobile (Capacitor).

See `AGENTS.md` for the full architectural directives and `PHASE_PLAN.md` for the staged build sequence.

## 🔒 Security

This project is built toward VAPT (Vulnerability Assessment & Penetration Testing) compliance:
- **SAST** — Semgrep OSS + SecurityCodeScan, enforced in CI.
- **DAST** — OWASP ZAP, run against staging on every merge.
- **MAST** — MobSF, run against the packaged mobile build.

See the "Security Testing & VAPT Compliance" section of `AGENTS.md` for full detail and the OWASP Top 10 mapping.

## 📄 License

MIT — see `LICENSE.md`.

# VisitorGuard — Admin Portal (PRD)

## Original Problem Statement
Production-quality Admin Portal for a WhatsApp-Based Visitor Management System (VMS) for small residential societies (30–200 apartments). Replaces manual visitor entry: residents generate visitor passes via WhatsApp → system issues a 4-digit PIN → visitor shows PIN to guard → guard verifies → entry recorded → resident notified. Every action auditable. Must feel like a real commercial B2B SaaS (Stripe/Linear/Vercel aesthetic), not a student dashboard.

## Stack (as built)
- Frontend: React 19 + React Router + Tailwind + shadcn/ui + lucide-react + recharts + react-query
- Backend: FastAPI (all routes under /api)
- DB: MongoDB (auto-seeds realistic demo data on startup)
- Auth: None (per user choice — portal opens as logged-in Admin/President)
- WhatsApp: SIMULATED via a "Create Pass" modal + seeded data + integration status indicator

## User Personas
- President/Administrator (this portal): manage residents, monitor passes, audit, reports, settings.
- Guard: PIN verification page (included in portal at /verify).
- Resident: interacts via WhatsApp (simulated).

## Core Requirements (static)
7 pages: Dashboard, Residents, Visitor Passes, Guard Verification, Logs, Reports, Settings. Enterprise design system (colors/typography/spacing as specified). Empty states, skeleton loaders, error+retry, responsive (sidebar collapses to Sheet on mobile), data-testids everywhere.

## Implemented (2026-06-24)
- Backend: /dashboard, /residents CRUD + pagination/search/toggle, /passes (list/summary/filters), /passes/expiring, /passes create/view/revoke, /verify, /passes/{id}/approve, /logs + /logs/export (CSV), /reports, /settings GET/PUT, /residents-min. Auto-seed: 48 residents, 140 passes, derived logs, settings.
- Frontend: full sidebar/topbar shell; Dashboard (KPIs, recent visitors, activity, quick actions); Residents (table, search/filter/pagination, Add modal w/ validation, details drawer); Visitor Passes (4 summary cards, filters, table w/ status badges, pass details drawer + lifecycle timeline, revoke confirm modal, Expiring Soon widget, create pass, export); Guard Verification (large keypad, green/red panels, approve entry); Logs (audit table, filters, CSV export); Reports (4 recharts + metrics); Settings (society/security/notifications/WhatsApp).
- Tested: testing agent — 100% backend (22 pytest), 100% frontend.

## Backlog / Next Tasks
- P1: Real WhatsApp integration (Twilio) — needs API keys.
- P1: Role-based auth (Admin + Guard login) if going to production.
- P2: Settings validation bounds for PIN expiry; return 201 on creates.
- P2: Custom date-range picker on Passes/Logs; resident edit (currently view drawer).
- P2: Background sweep to persist expired status; real-time updates.

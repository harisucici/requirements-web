# request/room — Frontend (Nuxt 3 + Tailwind, Nitro Mock API)

Full UI for the Request Management System PRD (`origin/yisheng/PRD.md` v1.0): 19 user-side routes (U-01~U-16) + 18 team-side routes (A-01~A-19), all wired to an in-memory Nitro mock API that mirrors `architecture-design.md` §4.3.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # vue-tsc, must stay at zero errors
npm run build        # production build (client JS ≈ 183 KB gzip total, NF-P6 ≤ 250 KB)
```

## Mock API

All data lives in `server/utils/mockDb.ts` (in-memory, seeded on first request). Pages only ever call the API — never import mock data.

| Task | How |
|---|---|
| Reset to seed data | `curl -X POST localhost:3000/api/__mock/reset` (also run after any dev-server restart) |
| Inject a network failure | Append `?__fail=1` to any API call → 500 `MOCK_FAULT` (UI shows "Connection failed, please try again") |
| Skip simulated latency | Append `?__nodelay=1` |

Conventions: `{code, message, data}` envelope · snake_case · integer cents · UTC ISO8601 · error codes `DUPLICATE_WINDOW` / `INVALID_TRANSITION` (409) / `VARIABLE_NOT_REPLACED` / `CHECKLIST_INCOMPLETE` / `TOKEN_EXPIRED`.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Reviewer | `reviewer@requestroom.com` | `mock1234` |
| Developer | `developer@requestroom.com` | `mock1234` |
| Admin | `admin@requestroom.com` | `mock1234` |
| User (P1 login) | `user@example.com` | `mock1234` |

Seed data covers all 9 statuses (27 requests), timelines, clarifications, deliverables, feedback (incl. a 2★ high-priority + SLA breaches), modifications (free/paid/rejected), refunds (requested/succeeded/rejected), failed notifications (for resend demo), email templates, pricing rules, automation rules A-01..A-20, audit log, tool templates, coupons (`WELCOME5`, `SHARE10`, `EXPIRED1`).

## Switching to the real backend

```bash
NUXT_PUBLIC_API_BASE=http://localhost:8000/api npm run dev
```

Default (empty) `apiBase` routes to the same-origin Nitro mock. Pages/components require zero changes — `types/api.ts` is the contract.

## Acceptance demo script (PRD §10.2, ~20 min)

1. Reset mock → guest opens `/request` → char counter, blur validation, draft restore (reload the page) → submit → success page → copy short ID.
2. Open the tracking link → **Under Review** badge + timeline.
3. Log in as reviewer → `/admin` KPIs → `/admin/requests` (Pending tab) → open the new request → 5-dimension scoring (watch the weighted total + decision hint) → estimated hours 2 → suggested $15 auto-fills → **Accept**.
4. Reply drawer: leave `{delivery_date}` unreplaced → send blocked and variable highlighted → fill it → send.
5. User tracking page → **Approved** → Pay Now → price breakdown → mock checkout ("Simulate declined card" demos U-08) → Confirm → payment success page → tracking shows **Payment Received**.
6. Log in as developer → `/admin/dev` → drag the paid card (or Start) → progress 50% → declare a delay with new ETA.
7. `/admin/requests/{id}/deliver` → leave one checklist item unchecked → Deliver blocked → check all 8 → Deliver.
8. User tracking page → **Completed** → View Tool → Leave Feedback (4★) → Request Modification (see "1 free revision remaining").
9. Log in as admin → `/admin/refunds` → create/execute a refund (fee = 2.9% + $0.30 shown) → `/admin/analytics` funnel reflects the flow.
10. Exceptions: resubmit with the same email within 24h → `DUPLICATE_WINDOW` dialog; double-accept a request → 409 toast; `?__fail=1` → connection-failed copy.
11. In-development requests show a **"Need it faster?"** rush entry (R-307): 50% surcharge checkout, ETA pulled to 24h.

## Layout notes

- User pages: `layouts/default.vue` (header/footer/cookie banner/toasts included — pages render `<main>` only).
- Admin pages: `definePageMeta({ layout: 'admin' })`, guarded by `middleware/admin-auth.global.ts`, sidebar filtered per role (PRD §2.2).
- Status badges always render text + icon (NF-A3); all 9 PRD §7.1 colors meet WCAG AA on their tint backgrounds.

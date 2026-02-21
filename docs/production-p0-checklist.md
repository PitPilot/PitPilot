# Production P0 Checklist

## Required Database Migration
Run:

`scripts/migrations/2026-02-21_p0_production_hardening.sql`

This migration adds:
- durable `sync_jobs` queue table + claim function
- `stripe_webhook_events` idempotency/audit table
- hot-path indexes for scouting/event queries

## Required Environment Variables
- `SUPABASE_SERVICE_ROLE_KEY`
- `SYNC_JOB_WORKER_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_RECONCILE_SECRET`
- `OPS_ALERT_WEBHOOK_URL` (recommended)
- `HEALTHCHECK_SECRET` (recommended)

## Worker Operations
- Queue worker endpoint:
  - `POST /api/events/sync/jobs/worker`
  - header: `Authorization: Bearer <SYNC_JOB_WORKER_SECRET>`
  - body: `{ "maxJobs": 5 }`

Recommended: call this endpoint on a cron schedule (every minute).

## Billing Operations
- Webhook endpoint:
  - `POST /api/stripe/webhook`
- Reconciliation endpoint:
  - `POST /api/stripe/reconcile`
  - header: `Authorization: Bearer <STRIPE_RECONCILE_SECRET>`
  - dry run body: `{ "dryRun": true }`

## Health/Monitoring
- Basic health: `GET /api/health`
- Full health (detailed checks):
  - header: `Authorization: Bearer <HEALTHCHECK_SECRET>`

Alert on:
- `overall=fail`
- dead-letter sync jobs > 0
- stripe webhook failed count > 0 in last 24h

## Load Test Baseline
Run:

`npm run loadtest -- --url https://your-domain --path /api/health --concurrency 30 --requests 2000`

For authenticated endpoints, add headers:

`--header "Cookie: sb-...=..." --header "Content-Type: application/json"`

Example budget:
- p95 latency <= 1500ms
- error rate <= 2%

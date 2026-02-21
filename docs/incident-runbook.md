# PitPilot Incident Runbook

## Scope
Use this runbook for production incidents involving:
- event/stat sync jobs
- Stripe billing/webhooks
- major API degradation

## Severity
- **SEV-1**: core scouting/billing unavailable for most teams.
- **SEV-2**: partial degradation, elevated failures, degraded latency.
- **SEV-3**: minor issue with workaround.

## Immediate Response (First 10 Minutes)
1. Acknowledge incident and assign an incident lead.
2. Check `/api/health` with `Authorization: Bearer $HEALTHCHECK_SECRET`.
3. Capture:
   - failing endpoint(s)
   - start time (UTC)
   - blast radius (which teams/features)
4. If sync queue is backed up, trigger worker:
   - `POST /api/events/sync/jobs/worker` with `Authorization: Bearer $SYNC_JOB_WORKER_SECRET`
5. If billing is inconsistent, run dry reconciliation:
   - `POST /api/stripe/reconcile` with `Authorization: Bearer $STRIPE_RECONCILE_SECRET` and body `{ "dryRun": true }`

## Containment Actions

### Sync/Scouting Degradation
1. Reduce worker contention by running worker in smaller batches (`maxJobs: 3`).
2. Verify dead-letter jobs from `/api/health` full response.
3. Requeue dead jobs manually if needed:
   - Set `phase='retrying'`, `run_after=now()`, clear `locked_at/locked_by` in SQL editor.

### Billing/Webhook Degradation
1. Verify Stripe webhook destination health in Stripe dashboard.
2. Inspect `stripe_webhook_events` rows with `status='failed'`.
3. Replay failed events from Stripe dashboard after fix.
4. Run non-dry reconciliation to backfill plan tier consistency.

## Rollback
1. Revert latest deployment in hosting dashboard.
2. Keep database migration in place (safe additive schema).
3. Re-run health checks and a targeted smoke test:
   - login
   - sync event
   - submit scouting entry
   - supporter checkout webhook

## Recovery Validation
- `overall` in `/api/health` is `ok`.
- No growth in dead-letter sync jobs.
- Stripe webhook failures stop increasing.
- Error rate and p95 latency return within budgets.

## Postmortem (Within 24 Hours)
1. Timeline with exact UTC timestamps.
2. Root cause and contributing factors.
3. Corrective actions:
   - code fix
   - alert/runbook updates
   - test coverage addition

# Operational Logging Standard


> If the project has a decision record governing logging, link it here and read it for the
> rationale; this standard is the day-to-day "how to log" contract.

## Purpose
Define one structured shape, a level policy, and a sensitive-data contract for
**operational logs** — the stream an operator reads to find and triage a failure — and keep
it distinct from any durable domain/audit log streams.

## Scope
- Backend process logs: requests, errors, crashes, lifecycle events, client-error ingest.
- Uncaught-error reporting from other surfaces (frontend, mobile) routed through the backend.
- The log sink and retention these ship to.

Out of scope: **durable domain/audit streams** (e.g. records of business-data mutations or
authentication events). Those are *separate, durable* streams — typically DB-backed. Do not
move domain/audit data into operational logs, or vice versa.

## Log streams (keep them separate)
Most projects benefit from distinguishing an *ephemeral operational* stream from one or more
*durable* streams. Define the project's streams here. A common shape:

| Stream | Where | Purpose | Helper |
|---|---|---|---|
| **Operational** (this standard) | stdout/stderr → log sink | Find/triage failures; ephemeral | a single `writeLog`-style helper |
| **Audit** (if applicable) | durable store (e.g. DB) | Durable record of domain mutations | a dedicated audit helper |
| **Auth events** (if applicable) | durable store (e.g. DB) | Durable record of auth activity | a dedicated auth-event helper |

> If the project only has operational logs, keep just the first row — but still keep
> domain/audit concerns out of the operational stream.

## Log shape
Every operational line is a single structured (JSON) object emitted from **one** logging
helper — never raw `console.*` / direct stream writes:

```jsonc
{ "timestamp": "ISO-8601", "level": "info", "type": "http_request", /* type-specific fields */ }
```

- **Required fields:** `timestamp`, `level`, `type`.
- **Correlation:** a `requestId` (also returned to clients, e.g. via an `X-Request-Id`
  header) and — *if multi-tenant* — a tenant/`orgId` for correlation **only** (never log
  another tenant's data).
- **Stable `type`s:** keep an enumerated set (e.g. `http_request`, `unhandled_error`,
  `unhandled_rejection`, `uncaught_exception`, `server_start`, `server_shutdown`,
  `client_error`). Add a **new** `type` rather than overloading an existing one; keep fields
  flat and stable.

### Client-error ingest (if other surfaces report errors)
If frontend/mobile POST uncaught errors to a backend ingest endpoint that emits a
`client_error` line, treat that input as **hostile**:
- **Session-light:** typically no auth required (a crash may pre-date login). Attach
  tenant/user identifiers **only** from a valid session token, **never** from the request body.
- **Untrusted input:** length-cap every field; redact emails, bearer/auth tokens, and long
  token-like runs from `message`/`stack` before logging.
- **Correlation:** a client-supplied request id refers to the *failing* call and is distinct
  from the ingest request's own id.
- **Rate-limit** the endpoint so a client crash-loop can't flood the sink.

## Levels & threshold
- Levels: `debug | info | warn | error`.
- A `LOG_LEVEL`-style env var sets the threshold (default `info`); lines below it are dropped.
- **`error` is never suppressed** — crash handlers depend on the `error` write flushing
  before the process exits. Keep the error-path write synchronous/flushed.
- Suggested request-line mapping: `info` (2xx/3xx), `warn` (4xx), `error` (5xx).
  Crashes / unhandled errors: `error`.

## Sensitive-data contract (non-negotiable)
**Never** put in an operational log:
- Session tokens, password/PIN material, MFA secrets, password-reset tokens.
- Any third-party / integration API tokens (and never decrypt an at-rest secret into a log).
- Full request or response bodies, or raw client input echoed unbounded.
- *If multi-tenant:* any cross-tenant data, or another tenant's identifiers.

Any endpoint that ingests externally-supplied error text must length-cap and redact it
before logging. Derive identity/tenant from session context, never from the request body.

## Sink & retention
Define where operational logs ship and how long they live:
- Ship container/process stdout/stderr to a centralized sink (the project's logging service).
- Set an **explicit retention** on operational log groups (ephemeral — they are for triage,
  not durable record-keeping).
- Keep heavier APM/tracing optional and off by default unless explicitly enabled.

## Where do I find errors?
Maintain a short runbook (e.g. `docs/runbooks/where-do-i-find-errors.md`) covering: log
group/location names per environment, how to filter by `requestId` (and tenant id, if
applicable), and what a typical failure trail looks like.

## Authoring checklist
- [ ] Used the single logging helper (not `console.*` / direct stream writes).
- [ ] Stable `type`; flat fields; `requestId` (and tenant id, if applicable) included where available.
- [ ] Correct level; nothing important logged below the default threshold.
- [ ] No token/secret/credential/PII/body/cross-tenant data in any field.
- [ ] Domain mutation / auth activity routed to its **durable** stream — not here.

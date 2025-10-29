# Auth Session Hardening – Implementation Plan

## 1. Background & Findings
- **Repeated 401/409 spikes**: Railway logs show recurring `token_expired` / `invalid_refresh_token` responses for `/api/v1/session`, `/api/v1/leaderboard`, and `/api/v1/auth/refresh`. Refresh tokens appear to be reused after rotation; once invalidated, the client keeps retrying, generating further 401 responses.
- **Telegram initData replay**: The backend rejects duplicated init data (`telegram_initdata_replayed`, HTTP 409) although replays often stem from legitimate tab refreshes within the 60 s TTL.
- **Rate limiting pressure**: `/auth/tma` and `/telemetry/client` hit the auth limiter (HTTP 429). Clients then retry aggressively, so throttling alone is insufficient.
- **Telemetry request aborts**: Multiple `request aborted` errors during `raw-body` parsing on `/api/v1/telemetry/client`, indicating the client closes connections mid-flight.
- **Quest metrics mismatch**: Frontend emits `buildings_purchased`, which the backend flags as `quest_metric_unknown`.

## 2. Design Principles
1. **Single-use refresh tokens with rotation** – Every refresh must mint a new refresh token and invalidate the previous one atomically, using persisted session state.
2. **Idempotent TMA auth** – Replays of valid Telegram init data within TTL should return the existing session, not error out.
3. **Deterministic client flow** – A shared session manager should serialise refresh attempts, proactively renew access tokens, and fall back to TMA when refresh fails.
4. **Backoff-friendly limits** – Rate limiters need to surface `Retry-After`; clients must respect it with exponential backoff.
5. **Actionable observability** – Log reasons for rejected refreshes / replays, and add metrics for throttling and session reuse.

## 3. Scope & Deliverables
### Backend
1. **Session schema upgrade**
   - Extend `sessions` table with columns: `version` (INT), `last_used_at` (TIMESTAMPTZ), `last_ip`, `last_user_agent`, `revoked_at`, `family_id`.
   - Backfill existing rows with defaults (version = 1, family = session id).
   - Introduce a new table `session_refresh_audit` to capture abnormal refresh attempts (Optional but recommended).
2. **AuthService changes**
   - On TMA auth:
     - Check init-data cache; if hash exists and session active, return tokens (mark response `replayed: true`).
     - Record `family_id` (UUID) shared by subsequent rotations.
   - On refresh:
     - Verify hashed refresh token + `version`.
     - Reject reuse by marking session `revoked_at` and logging reason `refresh_reuse`.
     - Mint new refresh token, increment version, update metadata, and respond with `refresh_token`, `refresh_expires_at`, `expires_in`.
     - Include `retry_after` if limiter triggered.
   - Add helper to expose `expires_in` and `refresh_expires_in` in every auth response.
3. **Middleware**
   - Adjust rate limiter for `/auth/tma` and `/auth/refresh` to return `Retry-After`. Consider raising `max` to 8 per minute once client backoff ships.
4. **Telemetry endpoint**
   - Wrap `raw-body` handling in abort-tolerant path: downgrade to `logger.debug` with metadata.
   - Accept compressed payloads (if Content-Encoding set) and cap size.
5. **Quest metric alignment**
   - Either register `buildings_purchased` in quest metric enum or harmonise naming with frontend.

### Frontend (webapp)
1. **Session manager module**
   - Store tokens in memory + secure storage (localStorage fallback encrypted via Web Crypto, as per project constraints).
   - Perform proactive refresh when `expires_in < 30s`.
   - Serialise refresh (single-flight) and clear cache on `invalid_refresh_token`.
   - On refresh failure → request fresh init data via `Telegram.WebApp.invokeAuthToken` (or fallback), call `/auth/tma`.
   - Respect `retry_after` header before retrying.
2. **Telemetry client**
   - Buffer events and flush at controlled cadence (e.g. max 1 request/3 s).
   - Implement exponential backoff on 429 or network errors, with jitter.
   - Add watchdog to drop payload if user navigates away to avoid aborted connections.
3. **Quest metric fix** – align emitted metric name with backend.

### Monitoring
1. Prometheus/Grafana: dashboards for 401/403/429 distribution, refresh success ratio, replay counts.
2. Alerting rule: >15 % of auth traffic ending in 4xx for 5 min triggers on-call.

## 4. Execution Plan

| Phase | Tasks | Owner | Notes |
| --- | --- | --- | --- |
| 1. Schema prep | - Create migration for `sessions` extension<br>- Backfill columns<br>- (Optional) Create audit table | Backend | Requires DB migration & downtime window check |
| 2. Backend logic | - Update repositories & services<br>- Implement replay-tolerant TMA auth<br>- Update rate limiter responses | Backend | Add unit/integration tests |
| 3. Frontend session manager | - Implement central session handling<br>- Wire interceptors for API client<br>- Update telemetry batching | Frontend | Cover with jest + smoke tests |
| 4. Alignment | - Sync quest metric name<br>- Update docs & env variables | Full stack | — |
| 5. Observability | - Add metrics/logging<br>- Update Grafana dashboards & alerts | DevOps | — |
| 6. QA & rollout | - Staging verification: token expiry, refresh reuse, replay flows, rate-limit handling<br>- Canary release & monitor logs | QA/Backend | — |

## 5. Risks & Mitigations
- **Token desync between tabs** – Mitigate via BroadcastChannel or storage events to share latest tokens across tabs.
- **Migration failure** – Migration must be idempotent; wrap in transaction and provide rollback script.
- **Telegram API availability** – Implement exponential backoff + user-facing indicator if TMA auth is unavailable.
- **Increased DB load** – Index new columns (`family_id`, `refresh_token_hash`) and monitor query plans.

## 6. Definition of Done
- 0 unresolved 401/409 bursts in logs over 48 h (aside from deliberate logouts).
- Replay attempts return 200 with `replayed: true`.
- Telemetry endpoint shows nil `request aborted` errors after rollout.
- Dashboard reflects refresh success rate ≥ 99 %, rate-limiter hit rate < 2 %.
- Documentation updated (`README`, deployment notes).


# RingCentral Integration — Scope, Not Yet Built

Written 2026-09-09. Nothing here is implemented. This is the answer to "what would
it take to stop hand-typing call and text counts", written before committing to it
so the blockers are visible first.

Emails are already auto-counted as of migration 054 — mail sent through Contact
Outreach increments `daily_activity.emails_auto` at the point of sending. Calls and
texts are still typed into Daily Tasks. RingCentral is what the team actually uses,
so it is the right source for both.

---

## 1. What blocks this today

None of it is code. In rough order of how long each takes to clear:

1. **A registered RingCentral app.** Created in the RingCentral Developer Console
   against *the team's own account*, not a personal sandbox. It yields a Client ID,
   Client Secret and — for server-to-server — a JWT credential.
2. **A publicly reachable HTTPS webhook URL.** The backend is deployed as a Vercel
   serverless function, so this part is fine; it needs a route and a stable URL.
3. **Graduation from sandbox to production.** RingCentral apps start sandboxed and
   need review before they can touch a real account's data. Budget days, not hours,
   and it is not something I can do on the team's behalf.
4. **An admin decision about scope of access.** Reading the *account's* call log
   means reading every extension's calls, not just the signed-in user's. Someone who
   owns that decision has to make it.

Until 1 and 3 are done, anything built here is untestable against real data.

## 2. Authentication

Use the **JWT auth flow**, not authorization code. This is server-to-server: the CRM
polls or receives events on its own schedule with nobody sitting at a browser, and
RingCentral recommends JWT for exactly that shape. A JWT credential plus client ID
and secret is exchanged for an access token, which is what actually calls the API.

Required scopes, from RingCentral's own examples:

| Scope | Why |
|---|---|
| `ReadCallLog` | Call records, at account or extension level — same permission for both |
| `SMS` | Sending and reading SMS |
| `Messages` | Message store access, which is where inbound SMS lands |
| `ReadAccounts` | Resolving extensions to people |

`ReadCallRecording` is a **separate** permission and is not needed — we want counts,
not audio. Leave it off; asking for it widens the review and the liability for no
benefit.

Credentials belong in the backend env alongside the Google ones
(`config/env.ts`), never in the frontend.

## 3. Which API, and the honest trade-off

Two ways to get the data, and they are not equivalent.

**Webhooks (push).** Subscribe via the Subscription API with event filters:

- SMS: `/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS`
- Calls: telephony session events

RingCentral sends a validation token on subscription creation which the endpoint
must echo back in an HTTP response header, and can send a developer-chosen
validation token on every subsequent webhook so we can verify the call really came
from RingCentral. Subscriptions can be set to effectively never expire by putting
the expiry far enough out; a `PUT` renews one.

**Call Log API (pull).** `GET /v1.0/account/{accountId}/call-log`, polled. Records
appear roughly 30 seconds after a call ends.

**Recommendation: poll the Call Log API first, add webhooks later if needed.**

The reasoning is unglamorous. A missed webhook is a permanently missing call — there
is no reconciliation, and the count silently drifts low, which is the exact failure
this whole exercise is meant to fix. A poll that fails just runs again and catches
up. Webhooks are better for anything needing to react *now*; a daily activity
counter does not. Start with the boring one that self-heals, and add push only if
somebody actually needs live numbers.

## 4. The part that will actually cause trouble

**Mapping a RingCentral extension to a PIC.** Everything above is plumbing. This is
the bit that decides whether the numbers are right.

Call log records identify an extension. `daily_activity` is keyed on `pic_id`. There
is nothing joining the two today — `pics` has `id`, `profile_id`, `name`, `status`
and nothing else. It needs a `ringcentral_extension_id` column, populated per person
in User Management, and a decision about what to do when a call arrives from an
extension that maps to nobody.

Do not match on the person's name. Two people share a name eventually, and the
counts silently attach to the wrong salesperson.

Unmapped extensions should land somewhere visible — a count of unattributed calls —
rather than being dropped. Silently discarding them reproduces the current problem
in a new place: figures that look complete and are not.

## 5. Data mapping

Assuming per-day, per-PIC aggregation into the existing columns:

| RingCentral | `daily_activity` column |
|---|---|
| Outbound call, any result | `calls_completed` |
| Outbound call, result `Accepted` | `calls_answered` |
| Outbound call, result `Missed` / `Voicemail` / `Busy` | `calls_unanswered` |
| Outbound SMS | `texts_completed` |
| Inbound SMS from a contacted number | `text_replies` |

Follow the pattern migration 054 established for email: **separate auto and manual
columns**, with the total generated. So `calls_manual` + `calls_auto` →
`calls_completed`, and the same for texts. The reasons hold here too — a measured
number must never be confused with a typed one, and a PIC saving the Daily Tasks
form must not wipe what the system observed. It also keeps every existing reader of
`calls_completed` (`get_dashboard_charts`, the monthly report) working untouched.

**Idempotency is not optional.** A poll will re-see the same call across runs. Store
the RingCentral record ID for every call and SMS counted, unique-indexed, and skip
what is already there. Incrementing blindly on each poll would inflate the counts
worse than hand-entry does.

## 6. A side benefit worth taking

Inbound SMS containing STOP / UNSUBSCRIBE could feed the Removed Sheet automatically
via the existing suppression path, and `texts_opted_out`. The opt-out machinery is
already built and tested — this is a small addition once the SMS feed exists, and it
closes a real compliance gap where someone opts out by text and nobody notices.

## 7. Rough order of work

1. `ringcentral_extension_id` on `pics`, editable in User Management. Useful alone,
   and blocks everything else.
2. `calls_manual` / `calls_auto` / `texts_manual` / `texts_auto` migration, mirroring
   054.
3. Table of processed RingCentral record IDs, for idempotency.
4. JWT auth + a thin RingCentral client in `backend/src/services/`.
5. Scheduled call-log poll, mapping extension → PIC, incrementing the auto columns.
6. SMS the same way.
7. Daily Tasks UI showing auto-counted calls and texts read-only, as it now does for
   email.
8. Opt-out detection, once SMS is flowing.

Steps 1–3 can be done now and are useful regardless. Steps 4 onward are blocked on
§1 credentials.

## 8. What I would check before building any of it

- Does the team's RingCentral plan actually include API access? Not all do.
- Do salespeople call from RingCentral consistently, or sometimes from a mobile? If
  the latter, auto-counting will read *lower* than reality and people will trust it
  less than the typed figure it replaced. Worth knowing before, not after.
- Is SMS sent from RingCentral, or from something else?

## Sources

- [Creating webhooks](https://developers.ringcentral.com/guide/notifications/webhooks/creating-webhooks)
- [Receiving webhooks](https://developers.ringcentral.com/guide/notifications/webhooks/receiving)
- [Event notifications and subscriptions](https://developers.ringcentral.com/guide/notifications)
- [Call log access control](https://developers.ringcentral.com/guide/voice/call-log/access)
- [JWT authentication flow](https://developers.ringcentral.com/guide/authentication/jwt-flow)
- [Configuring apps to use JWT](https://developers.ringcentral.com/guide/authentication/jwt/config-app)

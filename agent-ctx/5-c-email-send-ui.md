# Task 5-c — Email send UI integration

**Agent:** full-stack-developer (email send UI)
**Date:** 2025
**Task:** Integrate the real email sending flow (POST /api/email/send) into the Email Marketing module, replacing the simulated PATCH.

## Context

The previous email module (Task 2-e) had an "Enviar ahora" button that only PATCHed the campaign status to SENT. Task 4 added a real `/api/email/send` endpoint that fetches subscribers by audience, personalizes `{nombre}`, sends through the configured provider (DevProvider logs to console, ResendProvider sends real emails), and updates the campaign with realistic simulated open/click counts.

This task wires the UI to that real endpoint, adds a confirmation dialog, a provider badge, and SCHEDULED-state handling.

## Files reviewed

- `/home/z/my-project/worklog.md` — full history, especially Task 1 (foundation) and Task 4 (auth + email service abstraction).
- `/home/z/my-project/src/lib/services/email.ts` — DevProvider logs to console; ResendProvider uses Resend SDK; `EMAIL_PROVIDER_NAME` exported.
- `/home/z/my-project/src/app/api/email/send/route.ts` — POST handler, returns `{ sent, failed, total, provider, errors }`.
- `/home/z/my-project/src/components/dimar/modules/email.tsx` — original module, 857 lines.
- `/home/z/my-project/src/lib/types.ts` — EmailCampaign interface, AUDIENCES not present (defined locally in module).
- `/home/z/my-project/src/lib/store.ts` — toast type was `'success' | 'error' | 'info'` (no `warning`).

## Changes

### 1. `src/lib/store.ts`
- Extended `toast` type union to include `'warning'` so we can surface the "X enviados, Y fallidos" partial-failure case with the right semantic.

### 2. `src/app/page.tsx`
- Added `else if (type === 'warning') s.toast.warning(msg)` to the Sonner dispatcher that listens for the `dimar-toast` CustomEvent.

### 3. `src/components/dimar/modules/email.tsx`
- **Imports:** added `Loader2`, `Terminal`, `Zap` from `lucide-react`.
- **EmailModule state:** added `sendingId: string | null`, `confirmTarget: EmailCampaign | null`, `provider: 'dev' | 'resend'` (defaults to `'dev'` since dev mode is the default per Task 4).
- **`audienceCount(c)`** — useCallback that returns the number of active subscribers matching the campaign's audience (ALL = all active, otherwise `segment === audience`). Used by the confirmation dialog to display the recipient count.
- **`handleSendRequest(c)`** — opens the confirmation AlertDialog (sets `confirmTarget`).
- **`handleSendConfirm()`** — closes the dialog, sets `sendingId`, POSTs to `/api/email/send` with `{ campaignId }`, parses `{ sent, failed, total, provider, errors }`, refreshes the provider badge, toasts success/warning/error appropriately, calls `load()` to refresh, clears `sendingId` in `finally`.
- **`CampaignCard`** — new props `sending`, `audienceCount`; shows Loader2 spinner + "Enviando…" while sending; "Enviar ahora (no esperar)" when SCHEDULED with a future `scheduledAt`; "Enviar ahora" otherwise; audience badge "{N} suscriptores" before send; status text distinguishes "Programada para {date}" (future) vs "Programada {date}" (past). Delete button also disabled while sending.
- **`Header`** — new prop `provider`; renders a `ProviderBadge` next to the title (amber "Dev (logs)" with Terminal icon, or emerald "Resend" with Zap icon) plus a one-line hint below the subtitle.
- **New AlertDialog** for send confirmation: "¿Enviar campaña ahora?" with subscriber count + audience segment + scheduled date note (if applicable) + "Modo demo" notice when provider === 'dev'. Confirm button triggers `handleSendConfirm()`.
- **Existing delete AlertDialog** unchanged.

## Behavior summary

| Trigger | UI | API | Toast |
|---|---|---|---|
| Click "Enviar ahora" on DRAFT/SCHEDULED card | Opens AlertDialog | — | — |
| Confirm dialog | Spinner on card, button disabled | POST /api/email/send | — |
| Send success (failed === 0) | Card refreshes, status → SENT | — | success `Campaña enviada a ${sent}/${total} suscriptores` |
| Send partial failure (failed > 0) | Card refreshes, status → SENT | — | warning `${sent} enviados, ${failed} fallidos` |
| API error / network error | Card stays | — | error `Error al enviar la campaña` |
| Provider switch in env | Header badge switches amber→emerald after first send | — | — |

## Lint / compile

- `bun run lint`: 0 errors, 0 warnings.
- Dev server recompiles cleanly (no TypeScript errors).

## Notable decisions

- **No new fetch for provider hint.** The provider is a server-side env var; the simplest way to know it client-side is to read it from the send response. Before any send we default to `'dev'` (matches the project's default `EMAIL_PROVIDER=dev` set in Task 4). This avoids adding a new API route just to expose the env name.
- **Audience count is computed client-side** from the already-loaded subscribers list. It's a hint; the authoritative count comes back in the API response (`total`). The confirmation dialog uses the client-side count for the "Se enviará a N suscriptores" wording.
- **Toast type extension** was required because the task spec explicitly calls for a "warning" toast on partial failure. Sonner supports `toast.warning()` natively; we just needed to plumb the type through the existing `dimar-toast` CustomEvent channel.
- **Scheduled handling**: a SCHEDULED campaign with `scheduledAt` in the future gets the "Enviar ahora (no esperar)" button label and the "Programada para {date}" status line. If the scheduled date has passed (stuck campaign), the label reverts to "Enviar ahora" and status shows "Programada {date}". This matches the task spec literally ("If a campaign has status SCHEDULED and a scheduledAt in the future").

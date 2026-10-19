# Task 8-a — ImpulsePymes360 Panel + Onboarding Wizard

Agent: full-stack-developer (impulse panel + wizard)
Task: ImpulsePymes360 Panel + Onboarding Wizard (6 steps)

## Contexto leído
- worklog.md (Task 8 foundation): schema con Plan, Provider, Subscription, WebsiteExpress, QRCode, AdEdition, AdSpace. 10 APIs bajo /api/impulse/. Seed con 4 planes (Starter $29, Crecimiento $79, Premium $199, Enterprise $499), edición PubliBags Nov-2025-GYE con 80 espacios, proveedor demo TecnoExpress.
- src/lib/types.ts: Plan, Provider, WebsiteExpress, QRCodeInfo, AdEdition, AdSpaceInfo, PLAN_LABELS, ModuleId incluye 'impulse', 'impulse-wizard', 'web-express'.
- src/lib/store.ts: useAppStore con setModule(m) y toast(msg, type). currentUser.
- src/lib/security/auth.ts: getSessionUser/requireSession.
- API contracts verificados:
  * GET /api/impulse/me → Provider|null (con subscription.plan, website, qrCodes, adSpaces)
  * GET /api/impulse/plans → Plan[]
  * GET /api/impulse/editions → AdEdition[] (con availableSpaces, NO trae adSpaces por defecto)
  * POST /api/impulse/onboarding → { providerId, websiteSlug, qrCode, websiteUrl, message }

## Plan de trabajo
1. Crear impulse.tsx con hero, mini-cards, provider info, subscription, web express, QR, PubliBags, grid 6 elementos, stats row, loading skeleton, estado no-provider CTA.
2. Crear impulse-wizard.tsx con 6 pasos (datos negocio, plan, comisión afiliados, espacios PubliBags, Web Express, confirmación). Stepper, validación por paso, single formState, live preview, fetch plans + editions, POST onboarding, success screen.
3. Lint.
4. Append worklog.

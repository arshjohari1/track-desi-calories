# Track Desi Calories

A nutrition tracker for adults who eat South Asian home-cooked meals. Meal photos are followed by questions about portions, cooking fats, and ingredients before AI estimates calories and macros. These are estimates, not measured nutrition values.

## Features

- Photo identification, tailored cooking questions, and macro estimates
- Nutrition-label reading with serving scaling; manual meal entry
- Saved Kitchen dishes and quick re-logging
- Daily calorie target, nutrient totals, date navigation, and meal history
- 30-day trends and CSV export
- Email/password and Google sign-in, private per-user data, and light/dark themes

## Stack and source

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase Auth/Postgres, Vercel AI Gateway with Gemini, and optional Stripe billing. pnpm manages dependencies; Biome checks formatting and lint.

- `src/app/`: pages, server actions, and API routes
- `src/lib/ai/`: prompts, output schemas, and scan request validation
- `src/lib/billing/`: access entitlement and scan metering
- `src/lib/supabase/`: browser, server, and privileged server clients
- `supabase/migrations/`: schema, grants, and row-level security
- `public/screens/`: app screenshots for the landing page

## Local development

Use Node.js 24 and the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
# Create .env.local with the variables below.
pnpm dev
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key; data access is constrained by RLS |
| `AI_GATEWAY_API_KEY` | Server-only Vercel AI Gateway key with available credit |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key for scan refunds and the admin page |
| `CHALLENGE_EDITION` | Defaults to `true`: all signed-in users receive full access |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Optional Stripe billing configuration |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` | Optional recurring Stripe price IDs |

Never commit `.env.local`, expose the service-role key to the browser, or use `SKIP_ENV_VALIDATION` in production.

## Congressional App Challenge edition

The submission defaults to Challenge edition. It grants unlimited scans, saved dishes, full history, trends, and export to authenticated users, replaces purchase prompts, and refuses new checkout sessions. Authentication, onboarding, RLS, and admin authorization remain enforced. Usage records are still collected. No subscription rows are modified to grant this access.

Keep this edition available throughout judging. To restore normal free/paid tiers later, set `CHALLENGE_EDITION=false` and redeploy; configure and test Stripe before accepting payments. Signed Stripe webhooks remain enabled; existing paid subscriptions are not canceled by enabling Challenge edition.

## Release checks

```sh
pnpm lint
pnpm typecheck
pnpm test:release
pnpm build
pnpm check:services
```

The service check reads hosted table schemas and anonymous access only. It does not print credentials or modify records. Passing does not replace signed-in tests or establish that all migrations have been applied.

For an opt-in integration check against the configured database, run `node --env-file=.env.local scripts/check-live.mjs`. It creates two disposable test accounts, exercises the real server actions and account isolation, then removes those accounts and their test records. Add `--ai` to make three billable AI calls using an existing public app screenshot; these check connectivity and structured output, not nutrition accuracy.

## Deployment to Vercel

1. Import this repository as a Next.js project. Use Node 24, pnpm, `pnpm build`, and the default output directory. `vercel.json` disables automatic GitHub deployments; use an explicit deployment or intentionally change that setting.
2. Add required environment variables to Production. Set `CHALLENGE_EDITION=true` explicitly. Stripe variables are unnecessary for the Challenge edition.
3. Verify remote migration status with the Supabase CLI. Preview unapplied changes with `supabase db push --dry-run` before applying them; never reset the hosted database. See `.claude/rules/supabase.md`.
4. Deploy, then set Supabase Auth's Site URL to the stable public HTTPS URL. Add that site's `/auth/callback` to allowed redirect URLs. Verify Google is enabled and its OAuth configuration points to the Supabase callback.
5. Verify email signup behavior. If confirmations are enabled, verify email delivery and the production confirmation destination. The app explains when confirmation is required.
6. Ensure deployment protection allows judges access without a Vercel login. Check AI Gateway credit, successful scans, and function logs.
7. Test the public URL with a fresh account: onboarding, three or more scans, label reading, manual entry, save/re-log/delete, history, trends, export, settings, signout, and persistence after refresh. Verify cross-account isolation and admin authorization.

## Submission materials

Use a public 1–3 minute video. Show a genuine meal scan and cooking questions, then results, dashboard, Kitchen, labels/manual entry, history, and trends. Explain the intended adult audience, tools, and your technical contribution. Clearly identify any sample history. Disclose AI development assistance accurately in the application, separately from the AI integrated into the app.

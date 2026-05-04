# VibeShield — Deployment Guide

Follow this guide step by step to deploy VibeShield to production.

## Prerequisites

- Node.js 20+ and pnpm
- GitHub account with admin access
- Stripe account
- Vercel account (free tier is fine)

---

## 1. Vercel Project Setup

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link project
cd vibeshield
vercel link

# Set all environment variables (copy from .env.example)
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
# ... repeat for ALL vars in .env.example

# Deploy
vercel --prod
```

Or via Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Set "Framework Preset" to Next.js
4. Paste all environment variables from `.env.example`
5. Deploy

---

## 2. Supabase Project Setup

1. Go to https://supabase.com → New Project
2. Choose a name (e.g., `vibeshield`)
3. Set a secure database password
4. Wait for the project to be ready (~2 minutes)
5. Go to Project Settings → API:
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
6. Go to SQL Editor → paste the contents of `src/lib/db/schema.sql` → Run
7. Add these env vars to Vercel

---

## 3. Clerk Setup

1. Go to https://dashboard.clerk.com → Create Application
2. Name: `VibeShield`
3. Choose "GitHub" as the only social connection (User Management → Social Connections)
4. Go to API Keys → copy:
   - `Publishable Key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret Key` → `CLERK_SECRET_KEY`
5. After first Vercel deploy, add your Vercel domain to Clerk:
   - Clerk Dashboard → your app → Domains → Add your `*.vercel.app` domain

---

## 4. Trigger.dev Setup

1. Go to https://trigger.dev → Sign in with GitHub
2. Create a new project → name it `vibeshield`
3. Go to Environments & API Keys → copy `Development` key → `TRIGGER_API_KEY`
4. In your terminal:
   ```bash
   npx trigger.dev@latest init
   # Follow the prompts, use the same project ID
   npx trigger.dev@latest dev
   ```

---

## 5. Stripe Setup

### Create Products & Prices

1. Go to https://dashboard.stripe.com/products
2. Create Product → Name: `VibeShield Pro` → Type: Recurring → Price: $19/month
3. Copy the Price ID (starts with `price_`) → `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
4. Create Product → Name: `VibeShield Team` → Type: Recurring → Price: $49/month
5. Copy the Price ID → `NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID`

### API Keys

1. Stripe Dashboard → Developers → API Keys
2. Copy `Secret Key` (sk_live_...) → `STRIPE_SECRET_KEY`

### Webhook

1. Stripe Dashboard → Developers → Webhooks → Add Endpoint
2. URL: `https://your-domain.vercel.app/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy `Signing Secret` (whsec_...) → `STRIPE_WEBHOOK_SECRET`

---

## 6. GitHub App Setup

1. Go to https://github.com/settings/apps → New GitHub App
2. Fill in:
   - **Name**: `VibeShield`
   - **Homepage URL**: Your Vercel domain
   - **Webhook URL**: `https://your-domain.vercel.app/api/github/webhook`
   - **Webhook Secret**: Generate a random string → `GITHUB_APP_WEBHOOK_SECRET`
3. **Permissions**:
   - Contents: Read
   - Metadata: Read
   - Pull requests: Read & Write
4. **Subscribe to events**:
   - Push
   - Pull request
   - Installation
5. After creation:
   - Copy `App ID` → `GITHUB_APP_ID`
   - Generate & download private key → paste entire key into `GITHUB_APP_PRIVATE_KEY`
6. Install the app on your test repository

---

## 7. Sentry, PostHog, Resend

### Sentry
1. Go to https://sentry.io → Create Project → Next.js
2. Copy DSN → `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`

### PostHog
1. Go to https://app.posthog.com → Project Settings
2. Copy `Project API Key` → `NEXT_PUBLIC_POSTHOG_KEY`
3. Host: `https://app.posthog.com` → `NEXT_PUBLIC_POSTHOG_HOST`

### Resend
1. Go to https://resend.com → API Keys
2. Copy key → `RESEND_API_KEY`

---

## 8. DeepSeek API Keys

1. **DeepSeek**: https://platform.deepseek.com/api_keys → `DEEPSEEK_API_KEY`

---

## 9. Final Environment Variables Checklist

Make sure ALL of these are set in Vercel:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk |
| `CLERK_SECRET_KEY` | Clerk |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Stripe |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Stripe |
| `NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID` | Stripe |
| `GITHUB_APP_ID` | GitHub |
| `GITHUB_APP_PRIVATE_KEY` | GitHub |
| `GITHUB_APP_WEBHOOK_SECRET` | GitHub |
| `TRIGGER_API_KEY` | Trigger.dev |
| `TRIGGER_API_URL` | Trigger.dev |
| `RESEND_API_KEY` | Resend |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry |
| `SENTRY_DSN` | Sentry |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL |

---

## 10. Smoke Test Checklist

```bash
# 1. Open your app
curl https://your-domain.vercel.app/

# 2. Sign in with GitHub (should redirect to Clerk)

# 3. After sign-in, you should see the dashboard with "Connect GitHub Repo"

# 4. Install the GitHub App on a test repo

# 5. Push a commit → webhook fires → scan job enqueued

# 6. Check Trigger.dev dashboard for scan results

# 7. Open /settings → verify GitHub repos listed

# 8. Open /billing → click "Upgrade to Pro" → Stripe Checkout opens

# 9. Use Stripe test card: 4242 4242 4242 4242 → payment succeeds

# 10. After payment, plan should show "Pro" in billing page
```

---

## Troubleshooting

**Webhooks not firing**: Check GitHub App → Advanced → Recent Deliveries. Look for HTTP 200 responses.

**Stripe webhook 400 error**: Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret in Stripe Dashboard.

**Scan not running**: Check Trigger.dev dashboard → Runs. Make sure `TRIGGER_API_KEY` is correct.

**Clerk redirect loop**: Add your Vercel domain to Clerk → Domains → Allowed Origins.

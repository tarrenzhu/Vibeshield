# VibeShield —— Claude Code / Trae Solo CN 一键启动 Prompt

> 把下面整段 prompt 直接粘到 Claude Code 或 Trae Solo CN 的对话框，AI 会按阶段产出整个 MVP。
> 写法上做了三件事：(1) 一次性给足上下文；(2) 用 Phase 0 → Phase 5 切片，避免 AI 一上来写 1000 行；(3) 在每个 Phase 末尾要求 AI 暂停等用户确认，方便非技术创始人 review。

---

## 🚀 Master Prompt（直接复制下面整块）

```
You are my senior full-stack engineer + security researcher pair. We are
building VibeShield: a SaaS that scans GitHub repos for security issues
common in AI-generated ("vibe-coded") code, then gives non-technical
founders a one-click Cursor prompt to fix each issue.

== PRODUCT ONE-LINER ==
"Snyk for vibe coders. We tell you in plain language what's broken and
generate the exact Cursor prompt that fixes it."

== TARGET USER ==
Indie hackers and solo founders who use Cursor / v0 / Lovable / Bolt to
ship SaaS but don't know security. They want: connect GitHub → see
problems in plain English → click → fix.

== TECH STACK (do not deviate) ==
- Frontend + API: Next.js 15 (App Router) + TypeScript + Tailwind +
  shadcn/ui
- Auth: Clerk (GitHub OAuth)
- DB: Supabase Postgres
- Background jobs: Trigger.dev v3 (for long-running scans)
- LLM: OpenAI gpt-4o-mini for cheap stuff, Claude 3.5 Sonnet for the
  "explain in plain English" + fix prompt generation
- Payments: Stripe (Checkout + Customer Portal + Webhooks)
- Email: Resend
- GitHub integration: Octokit + GitHub App
- Hosting: Vercel
- Errors: Sentry
- Analytics: PostHog

== TEN V1 RULES (the only rules we ship in MVP) ==
1. RULE-001 Hardcoded secret (Supabase service_role, Stripe sk_live,
   OpenAI sk-, AWS AKIA*, generic high-entropy strings)
2. RULE-002 Supabase RLS not enabled OR service_role used in client code
3. RULE-003 Stripe webhook missing constructEvent signature verification
4. RULE-004 API route without rate limiting (heuristic + LLM judge)
5. RULE-005 CORS Access-Control-Allow-Origin: * on auth/admin endpoints
6. RULE-006 SQL string concatenation with user input
7. RULE-007 eval() / new Function() with user input
8. RULE-008 LLM prompt built by string-concat with user input (prompt
   injection)
9. RULE-009 /api/admin/* paths without auth check
10. RULE-010 S3 / GCS bucket policy is public in IaC config

== CORE USER JOURNEY ==
1. Sign in with GitHub → install our GitHub App on selected repos
2. We auto-trigger a "first scan" → results show on dashboard in 60s
3. User clicks a finding → sees plain-English explanation + a
   pre-generated Cursor prompt + an "Auto-fix PR" button (Pro-only)
4. User pastes prompt into Cursor → Cursor fixes it → user pushes
5. Next push triggers re-scan, finding closes automatically

== EXECUTION RULES (IMPORTANT) ==
- Work in PHASES below. After EACH phase, stop and ask me to confirm
  before continuing. Do NOT do all phases in one go.
- Always print the file tree you're going to create BEFORE writing
  files, so I can object.
- Write code in small, reviewable chunks. NEVER paste a 500-line file —
  break into clearly named functions.
- Add `// TODO(human):` comments where I (a non-technical founder) need
  to make a decision (e.g. set Stripe price IDs, paste GitHub App
  credentials).
- Every API route must have input validation (Zod) and error handling.
- All secrets read from env vars. Never hardcode. Add `.env.example`.
- All DB writes must go through a typed repository function (no inline
  Supabase calls in route handlers).
- After Phase 4, generate a one-page README explaining how to deploy.

== DESIGN SYSTEM ==
- Use shadcn/ui components only (Card, Button, Badge, Dialog, Tabs,
  Table). No custom design.
- Tailwind classes only, no inline styles.
- Severity colors: critical=red-600, warning=amber-600, info=blue-600,
  fixed=green-600.
- Empty states must include a friendly illustration suggestion (just
  reference Lucide icon names; do not add real images).

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
PHASE 0 — Scaffold (stop after this)
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
- Create a fresh Next.js 15 project with TS, Tailwind, App Router,
  ESLint, src/ dir, import alias @/*.
- Install: clerk, @supabase/supabase-js, @supabase/ssr, zod, stripe,
  octokit, openai, @anthropic-ai/sdk, posthog-js, @sentry/nextjs,
  resend, @trigger.dev/sdk, @trigger.dev/nextjs, lucide-react,
  shadcn-ui (initialize with neutral preset).
- Set up `.env.example` listing every env var we'll need with a comment
  for what it is and where to get it. List at minimum:
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    CLERK_SECRET_KEY
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY      # server only
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    OPENAI_API_KEY
    ANTHROPIC_API_KEY
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
    GITHUB_APP_ID
    GITHUB_APP_PRIVATE_KEY
    GITHUB_APP_WEBHOOK_SECRET
    TRIGGER_API_KEY
    TRIGGER_API_URL
    RESEND_API_KEY
    SENTRY_DSN
- Create the file tree structure (do not implement features yet, just
  empty stubs):
    src/
      app/
        (marketing)/  # public landing + pricing
          page.tsx
          pricing/page.tsx
        (app)/        # authenticated dashboard
          dashboard/page.tsx
          repos/[repoId]/page.tsx
          settings/page.tsx
          billing/page.tsx
        api/
          github/webhook/route.ts
          stripe/webhook/route.ts
          scan/[scanId]/route.ts
        layout.tsx
      lib/
        db/
          schema.sql
          repositories.ts
        scan/
          rules/         # one file per rule
          engine.ts
          cursor-prompt.ts
        github/
          app.ts
        llm/
          openai.ts
          anthropic.ts
        stripe/
          client.ts
      components/
        ui/             # shadcn-generated
        findings/
          FindingCard.tsx
          FindingDetail.tsx
        dashboard/
          KpiCard.tsx
          RepoCard.tsx
- Print the tree, the package.json scripts, and the .env.example.
- STOP. Ask me to confirm before Phase 1.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
PHASE 1 — Database + Auth (stop after this)
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
- Write `lib/db/schema.sql` matching the spec:
    users(id, email, github_username, created_at)
    orgs(id, name, plan, stripe_customer_id, created_at)
    org_members(org_id, user_id, role)
    repos(id, org_id, github_repo_id bigint, full_name, default_branch,
          last_scan_at, github_installation_id bigint)
    scans(id, repo_id, commit_sha, status, started_at, finished_at,
          total_findings, critical_count, warning_count)
    findings(id, scan_id, rule_id, severity, file_path, line_start,
             line_end, code_snippet, explanation_md, fix_prompt_md,
             status default 'open')
    rules(id, name, severity, description_md, fix_template_md)
    subscriptions(org_id, stripe_subscription_id, plan, status,
                  current_period_end)
    usage_counters(org_id, month, scan_count)
- Add Supabase RLS policies: users can only see their org's data.
- Implement typed repository functions in `repositories.ts` (e.g.
  `getRepoById`, `createScan`, `insertFindings`).
- Wire Clerk auth: configure middleware to protect `(app)/*` and
  `/api/*` (except the two webhook routes).
- On first sign-in, sync user → create personal org with plan='free'.
- Build a barebones /dashboard that shows "Hello {user.email}, no repos
  connected yet, click Connect GitHub" — no logic yet.
- STOP. Ask me to:
  (a) run `schema.sql` in Supabase
  (b) paste Clerk keys
  Then proceed to Phase 2.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
PHASE 2 — GitHub App + Scan Trigger (stop after this)
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
- Help me set up the GitHub App. Generate exact instructions: what
  permissions to request (Contents: read, Metadata: read, Pull
  requests: write, Webhooks subscribe to push and pull_request),
  callback URL, webhook URL, where to put the private key.
- Implement `/api/github/webhook/route.ts` to:
    - verify webhook signature against GITHUB_APP_WEBHOOK_SECRET
    - on `installation.created` insert/update repos rows
    - on `push` to default branch enqueue a Trigger.dev job
      `runScan({ repoId, commitSha })`
- Implement Trigger.dev job `runScan` skeleton in
  `src/trigger/jobs.ts`:
    1. mark scan as 'running'
    2. call scanEngine.run(...) (stub for now, returns 0 findings)
    3. mark scan as 'done', notify
- Build /repos/[repoId] page that lists scans + their findings
  (initially empty).
- STOP. Ask me to:
  (a) create the GitHub App in github.com/settings/apps
  (b) paste GITHUB_APP_ID / private key / webhook secret
  (c) install on a test repo
  (d) confirm webhook fires
  Then proceed to Phase 3.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
PHASE 3 — Scan Engine + Rules (stop after this)
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
- Implement `lib/scan/engine.ts`:
    - sparse-clone repo at commitSha to /tmp using
      simple-git (or just use the GitHub Contents API to pull files)
    - walk source files (.ts, .tsx, .js, .jsx, .py, .env*, .yml, .yaml,
      .toml, IaC files)
    - run each rule in parallel, collect Finding[]
    - for findings with confidence < 0.8, call
      verifyWithLLM(finding, fileContext) using gpt-4o-mini to confirm
      it's not a false positive
    - for confirmed findings, call generatePlainExplanation(finding,
      fileContext) using Claude 3.5 Sonnet → returns explanation_md
    - call generateCursorPrompt(finding, fileContext) using Claude →
      returns fix_prompt_md
    - upsert into findings table

- Implement all 10 rules under `lib/scan/rules/`. Each rule is a file
  exporting:
    {
      id: 'RULE-001',
      severity: 'critical',
      check: async (file: SourceFile) => Hit[]
    }
  RULE-001 (hardcoded secret) — combine:
    - regex patterns for known prefixes (sk-, AKIA, eyJ..., etc.)
    - high-entropy string detector (Shannon entropy >4.5 over 32+ chars)
    - confidence boost if the variable name contains 'key' or 'secret'
  RULE-002 (Supabase) — AST scan: any client-side file that imports
    SUPABASE_SERVICE_ROLE_KEY OR uses createClient with service role.
    Use ts-morph for TS AST.
  RULE-003 (Stripe webhook) — find handlers under api/stripe/webhook
    that don't call stripe.webhooks.constructEvent.
  RULE-004..010: implement with the simplest viable approach. RULE-008
    and RULE-004 are LLM-as-judge.

- Each rule writes its findings with: filePath, lineStart, lineEnd,
  codeSnippet (5 lines around hit), confidence (0..1).

- Add unit tests for each rule using vitest. Each rule test imports a
  small fixture file, runs the rule, asserts at least one expected hit
  and zero on a clean fixture.

- STOP. Run the test suite. Show me failing tests. Do not move on
  until all 10 rules pass their fixtures.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
PHASE 4 — UI: Dashboard + Findings + Cursor Copy (stop after this)
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
- Build /dashboard:
    - 4 KpiCard: Critical / Warning / Repos / Fixed this week
    - Grid of RepoCard: name, severity badge, last scan time, click to
      go to /repos/[repoId]
    - Empty state: "Connect a GitHub repo to start" with primary
      button.

- Build /repos/[repoId]:
    - Header: repo name, latest commit sha, "Re-scan" button
    - Two-column: left = list of FindingCard (sorted critical first),
      right = FindingDetail of selected finding
    - FindingCard: severity dot, title (truncated), file:line
    - FindingDetail:
        - severity pill + rule id
        - title (h2 size)
        - explanation_md (rendered as markdown, plain English)
        - code_snippet in a dark-themed <pre> with the hit lines
          highlighted
        - 3 buttons: "Copy Cursor prompt" (copies fix_prompt_md to
          clipboard), "Auto-fix PR" (Pro only — disabled for free),
          "Mark as false positive" (sets status, posts feedback)
        - "How to fix in 30 seconds" callout below

- Build /settings:
    - GitHub repos connected (uninstall button)
    - Slack webhook URL (optional)
    - API key for CLI (Pro only, masked)

- Build /billing:
    - Show current plan
    - Upgrade button → Stripe Checkout
    - Manage subscription button → Stripe Customer Portal

- Marketing landing page:
    - Hero: "Snyk for vibe coders. Catch the security issues Cursor
      doesn't."
    - Three pricing tiers (Free / Pro $19 / Team $49)
    - Three social proof slots (placeholder testimonials)
    - CTA: "Connect GitHub — free forever for 1 repo"

- STOP. Run `pnpm dev`, walk me through the empty UI, ask me to give
  feedback before Phase 5.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
PHASE 5 — Billing + Auto-Fix PR + Polish + Deploy (stop after this)
= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
- Stripe:
    - Create Pro and Team products (give me the dashboard click-path)
    - Implement /api/stripe/checkout/route.ts → creates Checkout
      session for current org
    - Implement /api/stripe/webhook/route.ts → verifies signature,
      updates orgs.plan and subscriptions table on
      checkout.session.completed, customer.subscription.updated,
      customer.subscription.deleted
    - Gate Pro features (auto-fix PR, Slack notifications, multi-repo)
      via a `requirePlan(orgId, 'pro')` helper

- Auto-Fix PR (Pro only):
    - When user clicks "Auto-fix PR" on a finding, enqueue a
      Trigger.dev job `autoFixPr({findingId})` that:
        1. clone repo
        2. run a Claude-powered patcher: feed it explanation_md +
           fix_prompt_md + the file content → return unified diff
        3. apply the patch to a new branch
           `vibeshield/fix-{ruleId}-{shortSha}`
        4. commit with message
           `🛡️ VibeShield: Fix {rule.name}`
        5. push and open PR via Octokit; PR description includes
           explanation + risk + how to verify
    - Show the PR URL in the UI when ready

- Notifications:
    - On scan complete, if Pro org has slack_webhook set, post a
      summary
    - Always send a Resend email summary to org owner

- Observability:
    - Sentry: capture all unhandled errors (server + client)
    - PostHog: track install_github_app, scan_completed,
      finding_clicked, copy_cursor_prompt, autofix_pr_opened,
      upgrade_clicked, upgrade_completed

- Final polish:
    - Loading states on all async UI
    - Toast on copy-to-clipboard ("Cursor prompt copied — paste in
      Cursor chat")
    - Mobile-responsive dashboard (<768px stacks vertically)

- Deploy:
    - Generate a `DEPLOY.md` walking me through:
        1. Vercel project setup, env var paste
        2. Supabase project setup, schema.sql apply
        3. Trigger.dev project setup
        4. Stripe product creation with exact field values
        5. GitHub App publication
        6. Sentry, PostHog, Resend setup
        7. Smoke test checklist

== STARTING NOW ==
Begin with PHASE 0 only. Print the file tree, package.json scripts,
and .env.example. Then STOP and ask me for confirmation before going
to Phase 1.
```

---

## 📌 使用说明

### 用 Claude Code（CLI 版）
1. `cd` 到一个空目录
2. `claude` 启动
3. 把上面 ```` ``` ```` 之间整段 Master Prompt 粘贴进去回车
4. AI 会先做 Phase 0、停下来问你确认 → 你回 "yes phase 1" → 继续
5. 在每个 STOP 处，AI 会让你做一些操作（建 Supabase 项目 / 装 GitHub App / 粘 Stripe key），照做即可

### 用 Trae Solo CN
1. 新建一个空项目
2. 在对话框粘贴整段 Master Prompt
3. Trae Solo 会自动建项目结构 → 在每个 Phase 末尾会问 "继续吗"
4. 你回 "继续 Phase X" 即可
5. Trae Solo 比较激进，建议在 Phase 3 之前手动测试每一个 rule 的 fixture

---

## 🛠️ Phase 之间的"接力 prompt"（卡住时可单独用）

如果某个 phase 卡住了，可以单独喂下面的"延续 prompt"。

### 卡在 Phase 2（GitHub App 不触发）
```
Diagnose why the GitHub webhook is not firing. Check:
1. Webhook URL in GitHub App settings matches NEXT_PUBLIC_APP_URL
2. The signature verification in /api/github/webhook is correct
3. Look at Recent Deliveries in GitHub App → Advanced and tell me the
   exact response code we returned
4. Print a curl command I can run locally with ngrok to replay the
   webhook
```

### 卡在 Phase 3（规则误报多）
```
Run the test suite for rules. For each rule with >20% false positive
rate against the reference fixture set, suggest a tighter heuristic
or move that part to LLM-as-judge. Print before/after precision and
recall.
```

### 卡在 Phase 5（Stripe webhook 校验失败）
```
The Stripe webhook is returning 400. Check:
1. We are using stripe.webhooks.constructEvent (not parseEvent)
2. The signature is read from request.headers.get('stripe-signature')
3. The body is read as raw text via request.text() before parsing
4. STRIPE_WEBHOOK_SECRET in env matches the signing secret shown in
   Stripe Dashboard → Webhooks → endpoint
Print the exact 5 lines of code that should be in the route.
```

---

## 🧪 验收 Checklist（4 周后用这个测试）

```
□ 没装我的 GitHub App 时，dashboard 只展示空状态 + 主 CTA
□ 装上 GitHub App 后，60 秒内出现"first scan"结果
□ 至少能 catch 三种泄漏: Supabase service_role / Stripe sk_live /
  OpenAI sk-
□ 点击任一 finding，能看到大白话解释（中英文我都试一下）
□ "Copy Cursor prompt" 真的把 prompt 复制到剪贴板
□ 把 prompt 粘到 Cursor 后，Cursor 能正确改完（人工验证）
□ Free plan 不能用 Auto-Fix PR（应灰色提示升级）
□ 升级 Pro 走通 Stripe Checkout，立刻解锁 Auto-Fix PR
□ Auto-Fix PR 真能开出 GitHub PR，标题 / 描述带 VibeShield 标识
□ 在 PR 合并后下次 push，对应 finding 自动 close
□ Sentry 能收到一次故意 throw 的错误
□ PostHog 能看到 funnel: 安装 → first scan → finding clicked → copy
  prompt → upgrade
```

---

## 💡 Vibe Coding 心法（写给非技术创始人）

1. **永远不要让 AI 一次写超过 200 行**。Phase 切片是为了你能 review。
2. **每个 Phase 完了先在本地跑通**，再去下一个。一个 phase 出 bug 不要硬跨。
3. **AI 写不出来的地方往往是 "粘合剂"**：环境变量怎么填、第三方账号怎么开、webhook URL 怎么配——这些 AI 给的指引你要逐字执行。
4. **Trigger.dev / Supabase / Stripe 三个平台的免费额度足够你跑到 100 用户**，先别想自托管。
5. **当你看不懂 AI 写的代码时**，跟 AI 说 "explain line by line as if I'm 5 years old"——这是 vibe coder 最常用的咒语。

# VibeShield 产品方案说明

> 让 Vibe Coder（用 AI 写代码的非技术创始人）也能 ship 安全的代码

**版本**：v1.0 MVP Spec
**日期**：2026-04-26
**目标**：4–6 周内独立 ship 可付费的 V1

---

## 一、产品定位

### 一句话定义
VibeShield 是给 vibe coder 用的「Cursor 安全审计副驾」——每次部署自动扫描 AI 生成代码里的常见安全漏洞，用大白话告诉你"哪里有问题、为什么危险、用一行 Cursor prompt 就能修好"。

### 不是什么
- ❌ 不是 Snyk / SonarQube 的复刻（那些给专业工程师看，规则库太重、报告太学术）
- ❌ 不是通用 SAST 工具（不试图覆盖所有 CWE）
- ❌ 不是 LLM-only 黑盒（要能解释清楚每个发现的根因）

### 是什么
- ✅ 专门检测 AI-generated code 高频漏洞模式（硬编码 secret / Supabase RLS / Stripe webhook / CORS / Prompt Injection / 暴露的 Admin API）
- ✅ 大白话报告 + 一键生成 Cursor 修复 prompt
- ✅ GitHub App + Vercel 集成，零配置接入

---

## 二、用户与场景

### 主要用户画像

**🧑 Indie Hacker Sarah**
- 35 岁、产品设计师转独立开发者
- 用 Cursor / v0 / Lovable 做 SaaS
- 有 3 个上线项目，月入 $2k MRR
- 痛点：上次发现 Supabase 表的 RLS 没开，所有用户邮箱被抓走
- 付费意愿：$19/月毫不犹豫

**👨‍💼 Solo Founder Marcus**
- 28 岁，第一次创业，做 AI 工具站
- 不懂安全，只知道"key 不能泄漏"
- 痛点：Stripe webhook 没验签被薅羊毛
- 付费意愿：$9–$19/月

**🏢 小团队 Tech Lead Lin**
- 5 人 startup，CTO 兼任安全
- 团队都在用 Cursor 写代码
- 痛点：review PR 时漏掉 AI 生成的低级安全 bug
- 付费意愿：$49/月 Team plan

### 核心场景

```
场景 1：首次接入
Sarah 在 GitHub Marketplace 装上 VibeShield → 选 1 个 repo
→ 自动扫描全仓代码 → 30 秒后看到「3 个 Critical / 12 个 Warning」
→ 点开 Critical "你的 Supabase service_role key 被硬编码到了 src/app/api/route.ts"
→ 一键复制 Cursor prompt → 粘贴到 Cursor → 自动改完发 PR

场景 2：日常 Push
Marcus push 新代码 → VibeShield 自动扫描 → 在 PR 里评论
"⚠️ 这个 Stripe webhook 没有验证签名，攻击者可以伪造支付成功事件"
→ Marcus 点 "Auto-fix" → VibeShield 直接提一个 PR 改好

场景 3：付费转化
Sarah 用免费版扫了 5 次 → 发现 1 个 Critical 漏洞 → 顿悟"这玩意救命"
→ 升级 Pro → 解锁实时 PR 检查 + Slack 通知 + 历史趋势
```

---

## 三、核心功能设计（MVP）

### 3.1 漏洞规则集 V1（10 个最高 ROI 规则）

| # | 规则 | 严重等级 | 检测方式 |
|---|---|---|---|
| 1 | 硬编码 API key / secret（Supabase / Stripe / OpenAI / AWS） | 🔴 Critical | 正则 + entropy + LLM 二次确认 |
| 2 | Supabase RLS 未开启（含 `.env.local` 用 service_role） | 🔴 Critical | AST 扫描 supabase client 用法 |
| 3 | Stripe webhook 未验证签名 | 🔴 Critical | AST 扫描 `stripe.webhooks.constructEvent` 调用 |
| 4 | API route 未做 rate limiting | 🟡 Warning | 启发式 + LLM 判断 |
| 5 | CORS `*` 暴露敏感端点 | 🟡 Warning | 配置文件扫描 |
| 6 | SQL 字符串拼接（潜在 SQL injection） | 🔴 Critical | AST + LLM |
| 7 | `eval()` / `new Function()` 与用户输入拼接 | 🔴 Critical | AST |
| 8 | Prompt Injection 防护缺失（用户输入直接拼到 LLM） | 🟡 Warning | LLM-as-judge |
| 9 | Admin API 路径未鉴权（`/api/admin/*`） | 🔴 Critical | 路径模式 + AST |
| 10 | 公开的 S3 / GCS bucket 在配置文件 | 🟡 Warning | 配置扫描 |

### 3.2 三个核心页面

#### 页面 A：Dashboard（仓库列表 + 总览）
- 顶部 KPI 卡：Critical / Warning / Repos Scanned / 上周修复数
- 仓库卡片网格：每个 repo 的最新扫描状态、严重级别、上次扫描时间
- 顶部 CTA："+ Connect GitHub repo"

#### 页面 B：Scan Results（单仓扫描结果）
- 左侧：漏洞列表（按严重级别排序）
- 右侧：选中漏洞的详情
  - 大白话解释（普通话/英文）："你把 Supabase 的超级管理员 key 写在了前端代码里，任何人 F12 就能看到"
  - 风险级别 + 真实案例链接
  - 受影响代码片段（高亮）
  - 一键复制 Cursor 修复 prompt
  - 一键 "Auto-fix"（VibeShield 自动提交 PR）
  - "Mark as false positive" 反馈按钮

#### 页面 C：Settings & Billing
- GitHub repo 连接管理
- Slack / Discord 通知 webhook
- API key（Pro 用户调用 CLI）
- 订阅升级
- 团队成员邀请（Team plan）

### 3.3 关键差异化交互

#### 「Cursor Prompt 一键复制」
点击漏洞卡片右上角 Copy 按钮 → 自动生成结构化 prompt：
```
@src/app/api/checkout/route.ts

This file has a critical security issue: the Stripe webhook endpoint
is not verifying the signature, which means anyone can fake payment
success events.

Please fix by:
1. Add `stripe.webhooks.constructEvent()` with the signing secret
2. Read STRIPE_WEBHOOK_SECRET from environment variable
3. Return 400 if signature verification fails

Do not change any other logic in this file.
```

→ 用户直接粘到 Cursor → Cursor 修改 → 用户 review → push。

#### 「Auto-Fix PR」
对于已知 pattern 的修复（Pro 功能），VibeShield 自己开 branch + commit + PR，标题：
`🛡️ VibeShield: Fix Stripe webhook signature verification`

PR description 里详细说明改了什么、为什么改、风险点。

---

## 四、技术架构

### 系统概览

```
┌──────────────────────────────────────────────────┐
│  Frontend (Next.js 15 + Tailwind + shadcn/ui)    │
│  - Dashboard / Scan Results / Settings           │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  API (Next.js Route Handlers + tRPC)             │
│  - Auth (Clerk)                                  │
│  - Webhook receiver (GitHub)                     │
│  - Stripe billing                                │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  Scan Engine (Node worker on Trigger.dev)        │
│  - Clone repo (sparse checkout)                  │
│  - Run rule-based scanners (regex + AST)         │
│  - Run LLM-as-judge for high-uncertainty hits    │
│  - Store findings to Postgres                    │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  Storage                                         │
│  - Supabase Postgres (users / orgs / scans /     │
│    findings / billing)                           │
│  - Supabase Storage (扫描日志归档)               │
└──────────────────────────────────────────────────┘
```

### 推荐技术栈

| 层 | 技术 | 理由 |
|---|---|---|
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Cursor 最熟、模板成熟 |
| Auth | Clerk | GitHub OAuth 一行接入 |
| Database | Supabase Postgres | 免运维、有 row-level security |
| Background Jobs | Trigger.dev v3 | 长任务调度+重试、免自建队列 |
| AI | OpenAI gpt-4o-mini + Claude 3.5 Sonnet（高难度规则） | 成本与质量平衡 |
| Payments | Stripe | 标配 |
| Notifications | Resend（邮件）+ Slack Webhook | 简单 |
| Hosting | Vercel | 一键 deploy |
| Monitoring | Sentry + PostHog | 必须 |
| GitHub Integration | Octokit + GitHub App | 标准做法 |

### 数据库 Schema（精简版）

```sql
-- Users / Orgs (Clerk 同步)
users (id, email, github_username, created_at)
orgs (id, name, plan, stripe_customer_id, created_at)
org_members (org_id, user_id, role)

-- Repos
repos (id, org_id, github_repo_id, full_name, default_branch, last_scan_at)

-- Scans
scans (
  id, repo_id, commit_sha, status, started_at, finished_at,
  total_findings, critical_count, warning_count
)

-- Findings
findings (
  id, scan_id, rule_id, severity,
  file_path, line_start, line_end, code_snippet,
  explanation_md, fix_prompt_md,
  status -- open / fixed / false_positive / wont_fix
)

-- Rules (静态加载，但配置存 DB)
rules (id, name, severity, description_md, fix_template_md)

-- Billing
subscriptions (org_id, stripe_subscription_id, plan, status, current_period_end)
usage_counters (org_id, month, scan_count)
```

### 扫描引擎逻辑

```typescript
// 伪代码
async function runScan(repoId: string, commitSha: string) {
  const scan = await createScan(repoId, commitSha);

  // 1. Sparse clone（只拉代码文件，不拉 git history）
  const repoPath = await sparseClone(repo, commitSha);

  // 2. 文件遍历
  const files = await listSourceFiles(repoPath);
    // 只看 .ts/.tsx/.js/.py/.env*/.yml 等

  // 3. 并行跑规则
  const findings = [];
  for (const file of files) {
    for (const rule of activeRules) {
      const hits = await rule.check(file);
      // hits 可能 high-confidence(直接保留) or low(送 LLM 二次判断)
      for (const hit of hits) {
        if (hit.confidence < 0.8) {
          const llmVerdict = await verifyWithLLM(hit, file);
          if (!llmVerdict.isReal) continue;
          hit.explanation = llmVerdict.explanation;
        }
        findings.push(hit);
      }
    }
  }

  // 4. 生成大白话报告 + Cursor prompt
  for (const f of findings) {
    f.fixPrompt = await generateFixPrompt(f);
  }

  // 5. 入库 + 通知
  await saveFindings(scan.id, findings);
  await notify(scan, findings);
}
```

---

## 五、商业模式

### 定价

| Plan | 价格 | 限额 | 关键功能 |
|---|---|---|---|
| **Free** | $0 | 1 repo / 5 scans/月 | 基础扫描 + 大白话报告 |
| **Pro** | $19/月 | 5 repos / 无限 scan | + PR 实时检查 + Cursor prompt + Slack 通知 |
| **Team** | $49/月 | 25 repos / 5 seats | + Auto-Fix PR + 团队仪表盘 + SSO |
| **Enterprise** | Custom | 无限 | + 私有规则 + 自托管 + 合规报告 |

### 单位经济（估算）

- 平均扫描 LLM 成本：$0.02 / scan（gpt-4o-mini + 偶尔 Claude）
- Pro 用户月均 30 次扫描 ≈ $0.6 LLM 成本
- 毛利率约 92%
- 关键 CAC 渠道：GitHub Marketplace、Cursor 社区、Indie Hackers、X、Reddit r/cursor

---

## 六、4 周 MVP Roadmap

### Week 1 — 骨架
- ✅ Next.js + Clerk + Supabase 搭起来
- ✅ 用 GitHub OAuth 拿 repo list
- ✅ 写最简单的 1 个规则：硬编码 Supabase service key
- ✅ Dashboard 展示一条 finding

### Week 2 — 规则集 + LLM 编排
- ✅ 实现 10 个核心规则（混合 regex + AST + LLM）
- ✅ 写 prompt 模板，让 LLM 把技术报告翻成大白话
- ✅ Cursor prompt 生成器

### Week 3 — GitHub App + Webhook + Billing
- ✅ 改成 GitHub App（替代 OAuth），可监听 push event
- ✅ 接入 Stripe，三个 plan
- ✅ Slack / Discord webhook 通知
- ✅ 添加 PostHog + Sentry

### Week 4 — Polish + Launch
- ✅ 大白话报告再打磨
- ✅ Landing page + 定价页
- ✅ 在 r/cursor / r/SaaS / Indie Hackers / X / Hacker News Show HN 发布
- ✅ 找 50 个 design partner 内测，收集 false positive

---

## 七、Day-1 开发优先级（如果只能做 1 周）

如果时间极度紧张，建议这样裁剪 V0：
1. **不做 GitHub App**，先做"上传 zip 文件扫描"的 web 工具
2. **只做 3 个规则**（Supabase service key 泄漏、Stripe webhook 不验签、硬编码 OpenAI key）
3. **不做计费**，免费试用收集 100 个邮箱
4. **不做 Auto-Fix PR**，只生成 Cursor prompt 给用户复制

这样 5–7 天可上线 → 验证有没有人愿意上传 → 拿到第一波反馈再加 GitHub App。

---

## 八、风险与对策

| 风险 | 概率 | 对策 |
|---|---|---|
| False positive 率高，用户卸载 | 高 | LLM 二次判断 + "mark as FP" 一键反馈 + 持续迭代规则 |
| Snyk / GitHub Code Scanning 顺势打 vibe coder 市场 | 中 | 抢先建立社区品牌 + 与 Cursor / Lovable 抢先集成 |
| LLM 成本飙升 | 低 | 缓存相同代码 hash 的扫描结果 + 路由到便宜模型 |
| GitHub App 审核被拒 | 低 | 严格遵循 GitHub App 安全规范 + 不存代码原文 |
| 用户隐私顾虑（"你扫了我的代码"） | 中 | 默认不存代码原文（只存路径+行号+片段）+ 自托管 Enterprise 选项 |

---

## 九、KPI

### 启动 90 天目标
- 1000 个 GitHub App install
- 100 个 free → Pro 转化（$1900 MRR）
- 平均扫描发现 3+ findings
- False positive 率 < 15%
- Show HN / Product Hunt 至少 1 次 top 5

### 长期愿景
- 成为 vibe coder 必装的 "$19/月 buy peace of mind" 工具
- 扩展到 v0、Lovable、Bolt、Replit Agent 等多 host 的"一键安全"
- 衍生：合规报告（SOC2 / GDPR for indie SaaS）、漏洞响应保险产品

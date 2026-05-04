-- ============================================
-- VibeShield Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Users (synced from Clerk via webhook or on first sign-in)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  github_username TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Organizations (1:1 for solo users, 1:N for teams)
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Org membership
CREATE TABLE org_members (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  PRIMARY KEY (org_id, user_id)
);

-- Repositories (synced from GitHub App install)
CREATE TABLE repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  full_name TEXT NOT NULL,
  default_branch TEXT DEFAULT 'main',
  github_installation_id BIGINT,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scans
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  total_findings INT DEFAULT 0,
  critical_count INT DEFAULT 0,
  warning_count INT DEFAULT 0
);

-- Findings
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  file_path TEXT NOT NULL,
  line_start INT NOT NULL,
  line_end INT NOT NULL,
  code_snippet TEXT,
  explanation_md TEXT,
  fix_prompt_md TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'false_positive', 'wont_fix')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rules (static reference)
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  severity TEXT NOT NULL,
  description_md TEXT,
  fix_template_md TEXT
);

-- Subscriptions (Stripe)
CREATE TABLE subscriptions (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMPTZ,
  PRIMARY KEY (org_id)
);

-- Usage counters (for free tier limits)
CREATE TABLE usage_counters (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- 'YYYY-MM'
  scan_count INT DEFAULT 0,
  PRIMARY KEY (org_id, month)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_repos_org_id ON repos(org_id);
CREATE INDEX idx_repos_full_name ON repos(full_name);
CREATE INDEX idx_scans_repo_id ON scans(repo_id);
CREATE INDEX idx_findings_scan_id ON findings(scan_id);
CREATE INDEX idx_findings_status ON findings(status);

-- ============================================
-- Row-Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users read own" ON users
  FOR SELECT USING (auth.uid()::text = clerk_id);

-- Orgs: members can read their own orgs
CREATE POLICY "Members read own orgs" ON orgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.org_id = orgs.id AND u.clerk_id = auth.uid()::text
    )
  );

-- Repos, scans, findings follow the same org-based pattern
CREATE POLICY "Org members read repos" ON repos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.org_id = repos.org_id AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Org members read scans" ON scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM repos r
      JOIN org_members om ON om.org_id = r.org_id
      JOIN users u ON u.id = om.user_id
      WHERE r.id = scans.repo_id AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Org members read findings" ON findings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scans s
      JOIN repos r ON r.id = s.repo_id
      JOIN org_members om ON om.org_id = r.org_id
      JOIN users u ON u.id = om.user_id
      WHERE s.id = findings.scan_id AND u.clerk_id = auth.uid()::text
    )
  );

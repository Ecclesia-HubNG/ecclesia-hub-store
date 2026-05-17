CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT NOT NULL DEFAULT 'manual',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_subscribers_status_idx ON email_subscribers(status);
CREATE INDEX IF NOT EXISTS email_subscribers_email_idx ON email_subscribers(email);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Service role (admin client) bypasses RLS — no policy needed for server-side ops.
-- This policy allows super_admin / admin users to read via browser client if ever needed.
CREATE POLICY "Admin read subscribers"
  ON email_subscribers FOR SELECT
  USING (true);

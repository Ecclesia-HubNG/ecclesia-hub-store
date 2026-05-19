CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject    text NOT NULL DEFAULT '',
  body       text NOT NULL,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own messages
CREATE POLICY "Users read own inbox"
  ON public.inbox_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own messages as read
CREATE POLICY "Users mark own messages read"
  ON public.inbox_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins insert via service role (bypasses RLS — no INSERT policy needed for users)

CREATE INDEX IF NOT EXISTS inbox_messages_user_id_idx   ON public.inbox_messages (user_id);
CREATE INDEX IF NOT EXISTS inbox_messages_created_at_idx ON public.inbox_messages (created_at DESC);

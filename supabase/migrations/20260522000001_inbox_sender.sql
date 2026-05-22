-- Add sender column so customers can reply to support
ALTER TABLE public.inbox_messages
  ADD COLUMN IF NOT EXISTS sender text NOT NULL DEFAULT 'admin'
    CHECK (sender IN ('admin', 'customer'));

-- Existing rows are all admin-sent; default covers them.

-- Allow customers to insert their own messages (support requests)
CREATE POLICY "Users send support messages"
  ON public.inbox_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND sender = 'customer');

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_messages;

CREATE TABLE IF NOT EXISTS public.email_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text        NOT NULL, -- order_confirmation | order_shipped | welcome | promo | newsletter
  to_email    text        NOT NULL,
  subject     text        NOT NULL,
  status      text        NOT NULL DEFAULT 'sent', -- sent | failed
  error       text,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (admin dashboard uses service role client)
CREATE POLICY "service role only" ON public.email_logs
  USING (false)
  WITH CHECK (false);
